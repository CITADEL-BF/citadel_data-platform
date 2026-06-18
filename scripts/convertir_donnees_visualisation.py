"""
Conversion des fichiers CSV nettoyés en JSON / GeoJSON prêts pour la visualisation dashboard V1.

Logique :
  - GeoJSON  → cartes Leaflet (boundaries régions/provinces + données jointes)
  - JSON      → graphiques ECharts (séries temporelles, KPI, barres, pyramides)
  - CSV       → téléchargement utilisateur + tableaux de données (fichiers source inchangés)

Sortie : data/viz/
  geojson/    → couches géographiques avec données jointes
  json/       → données séries pour graphiques
  csv/        → copies CSV pour téléchargement (un par visualisation)

Exécution : python scripts/convertir_donnees_visualisation.py
"""

from pathlib import Path
import json
import re
import shutil
import unicodedata
from datetime import date
import requests
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent

def _resolve_existing_path(*candidates: Path) -> Path:
    for p in candidates:
        if p.exists():
            return p
    return candidates[0]


# Nouveau standard: data/cleanead (cleaned) et data/raw (raw)
# Fallback legacy conservé pour rétro-compatibilité.
DATA_DIR = _resolve_existing_path(
    ROOT / "data" / "cleanead",
    ROOT / "data" / "cleaned",
    ROOT / "data",
)
RAW_DATA_DIR = _resolve_existing_path(
    ROOT / "data" / "raw",
    ROOT / "data_raw",
)
VIZ_DIR = DATA_DIR / "viz"
PUBLIC_DATA_DIR = ROOT / "public" / "data"
PUBLIC_VIZ_DIR = PUBLIC_DATA_DIR / "viz"
PUBLIC_CLEANED_DIR = PUBLIC_DATA_DIR / "cleaned"
PUBLIC_RAW_DIR = PUBLIC_DATA_DIR / "raw"
CATALOG_PATH_DATA = VIZ_DIR / "catalogue_datasets.json"
CATALOG_PATH_PUBLIC = PUBLIC_DATA_DIR / "catalogue_datasets.json"
(VIZ_DIR / "geojson").mkdir(parents=True, exist_ok=True)
(VIZ_DIR / "json").mkdir(parents=True, exist_ok=True)
(VIZ_DIR / "csv").mkdir(parents=True, exist_ok=True)

TODAY = date.today().isoformat()


# ---------------------------------------------------------------------------
# 1. Utilitaires
# ---------------------------------------------------------------------------

def normaliser_region(name: str) -> str:
    """Normalise un nom de région : supprime accents, met en Title Case, unifie tirets."""
    if not isinstance(name, str):
        return ""
    n = name.strip()
    n = unicodedata.normalize("NFC", n)
    # Majuscules → Title Case
    if n.isupper():
        n = n.title()
    # Uniformiser tirets/espaces courants
    corrections = {
        "Boucle Du Mouhoun": "Boucle du Mouhoun",
        "Boucle du Mouhoun": "Boucle du Mouhoun",
        "Plateau Central": "Plateau-Central",
        "Plateau-Central": "Plateau-Central",
        "Centre Nord": "Centre-Nord",
        "Centre Est": "Centre-Est",
        "Centre Ouest": "Centre-Ouest",
        "Centre Sud": "Centre-Sud",
        "Nord Est": "Nord-Est",
        "Sud Ouest": "Sud-Ouest",
        "Centre (Sans Ouagadougou)": "Centre",
        "Hauts Bassins": "Hauts-Bassins",
        "Burkina Faso": None,  # ligne nationale, à exclure des jointures régionales
    }
    return corrections.get(n, n)


def cle_admin(name: str) -> str:
    """Construit une clé de comparaison robuste (accents, casse, ponctuation)."""
    n = normaliser_region(name)
    if not n:
        return ""
    n = unicodedata.normalize("NFKD", str(n))
    n = "".join(ch for ch in n if not unicodedata.combining(ch))
    n = n.lower()
    n = re.sub(r"[^a-z0-9]+", " ", n)
    return re.sub(r"\s+", " ", n).strip()


def sauvegarder_json(obj, path: Path, label: str):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    taille_ko = round(path.stat().st_size / 1024, 1)
    print(f"  [OK] {label} → {path.relative_to(ROOT)} ({taille_ko} ko)")


def slugify_name(value: str) -> str:
    txt = unicodedata.normalize("NFKD", str(value or ""))
    txt = "".join(ch for ch in txt if not unicodedata.combining(ch)).lower()
    txt = re.sub(r"[^a-z0-9]+", "-", txt)
    return txt.strip("-")


def humanize_stem(stem: str) -> str:
    txt = stem.replace("_", " ").replace("-", " ").strip()
    txt = re.sub(r"\s+", " ", txt)
    return txt.capitalize() if txt else stem


def infer_domain_from_name(name: str, default: str = "autre") -> str:
    n = slugify_name(name)
    if n.startswith("securite"):
        return "securite"
    if n.startswith("population"):
        return "population"
    if n.startswith("education"):
        return "education"
    if n.startswith("economie"):
        return "economie"
    if n.startswith("sante"):
        return "sante"
    return default


def format_domain_label(domain: str) -> str:
    return {
        "securite": "Securite",
        "population": "Population",
        "education": "Education",
        "economie": "Economie",
        "sante": "Sante",
        "autre": "Autre",
    }.get(domain, "Autre")


def count_csv_rows(csv_path: Path) -> int:
    try:
        with csv_path.open("r", encoding="utf-8", errors="ignore") as f:
            # -1 pour ignorer l'en-tête quand présent
            return max(sum(1 for _ in f) - 1, 0)
    except Exception:
        return 0


def file_size_mb(file_path: Path) -> float:
    try:
        return round(file_path.stat().st_size / (1024 * 1024), 2)
    except Exception:
        return 0.0


def meta(titre: str, unite: str, source: str, note: str = "") -> dict:
    return {
        "titre": titre,
        "unite": unite,
        "source": source,
        "mise_a_jour": TODAY,
        "note": note,
    }


# ---------------------------------------------------------------------------
# 2. Téléchargement / cache des boundaries GeoJSON (geoBoundaries — open data)
# ---------------------------------------------------------------------------

BOUNDARIES = {
    "regions": {
        "local_paths": [
            VIZ_DIR / "geojson" / "bfa_admin1.geojson",
            VIZ_DIR / "geojson" / "bfa_regions_boundaries.geojson",
        ],
        "download_url": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/BFA/ADM1/geoBoundaries-BFA-ADM1.geojson",
        "download_path": VIZ_DIR / "geojson" / "bfa_regions_boundaries.geojson",
        "name_fields": ["adm1_name", "shapeName", "ADM1_FR", "NAME_1", "name"],
        "alias_fields": ["adm1_name_old", "adm1_ref_name", "adm1_name1", "adm1_name2", "adm1_name3"],
    },
    "provinces": {
        "local_paths": [
            VIZ_DIR / "geojson" / "bfa_admin2.geojson",
            VIZ_DIR / "geojson" / "bfa_provinces_boundaries.geojson",
        ],
        "download_url": "https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/BFA/ADM2/geoBoundaries-BFA-ADM2.geojson",
        "download_path": VIZ_DIR / "geojson" / "bfa_provinces_boundaries.geojson",
        "name_fields": ["adm2_name", "shapeName", "ADM2_FR", "NAME_2", "name"],
        "alias_fields": ["adm2_name_old", "adm2_ref_name", "adm2_name1", "adm2_name2", "adm2_name3"],
    },
    "communes": {
        "local_paths": [VIZ_DIR / "geojson" / "bfa_admin3.geojson"],
        "download_url": None,
        "download_path": None,
        "name_fields": ["adm3_name", "shapeName", "ADM3_FR", "NAME_3", "name"],
        "alias_fields": ["adm3_name_old", "adm3_ref_name", "adm3_name1", "adm3_name2", "adm3_name3"],
    },
}


def get_boundary_path(niveau: str) -> Path | None:
    cfg = BOUNDARIES[niveau]
    for p in cfg.get("local_paths", []):
        if p.exists():
            return p
    return None


def detect_name_field(geo: dict, niveau: str) -> str | None:
    feats = geo.get("features", [])
    if not feats:
        return None
    props = feats[0].get("properties", {})
    for f in BOUNDARIES[niveau].get("name_fields", []):
        if f in props:
            return f
    return None


def telecharger_boundaries():
    """Télécharge les couches géographiques minimales si absentes du cache local."""
    for niveau, cfg in BOUNDARIES.items():
        p = get_boundary_path(niveau)
        if p is not None:
            print(f"  [cache] Boundaries {niveau} déjà présentes ({p.name}).")
            continue
        if not cfg.get("download_url") or not cfg.get("download_path"):
            print(f"  [ABSENT] Boundaries {niveau} non trouvées en local (aucune URL de fallback).")
            continue
        print(f"  Téléchargement boundaries {niveau}...")
        try:
            r = requests.get(cfg["download_url"], timeout=30)
            r.raise_for_status()
            p = cfg["download_path"]
            p.write_bytes(r.content)
            print(f"  [OK] {p.name} ({round(p.stat().st_size / 1024, 0)} ko)")
        except Exception as e:
            print(f"  [ERREUR] Impossible de télécharger {niveau}: {e}")


def synchroniser_fichiers_admin_references():
    """Déplace les fichiers de référence tabulaires vers data/viz/csv pour téléchargement."""
    src = VIZ_DIR / "geojson" / "bfa_admin_boundaries.xlsx"
    dst = VIZ_DIR / "csv" / "bfa_admin_boundaries.xlsx"

    if src.exists() and not dst.exists():
        shutil.move(str(src), str(dst))
        print("  [OK] Référence admin déplacée vers data/viz/csv/bfa_admin_boundaries.xlsx")
    elif src.exists() and dst.exists():
        # Évite les doublons: la source geojson n'a plus d'utilité une fois copiée dans les téléchargements.
        src.unlink()
        print("  [cache] Référence admin déjà disponible dans data/viz/csv/ (doublon supprimé côté geojson).")
    elif dst.exists():
        print("  [cache] Référence admin tabulaire déjà disponible dans data/viz/csv/.")


def charger_geojson(niveau: str) -> dict | None:
    p = get_boundary_path(niveau)
    if p is None:
        print(f"  [ABSENT] Boundaries {niveau} non disponibles — saut.")
        return None
    with open(p, encoding="utf-8") as f:
        geo = json.load(f)
    name_field = detect_name_field(geo, niveau)
    if not name_field:
        print(f"  [ERREUR] Impossible d'identifier le champ de nom pour {niveau} ({p.name}).")
        return None
    print(f"  [OK] Boundaries {niveau}: {p.name} (champ nom: {name_field})")
    return geo


def joindre_donnees_geojson(geo: dict, df_region: pd.DataFrame, col_region: str,
                            cols_valeurs: list[str], niveau: str) -> dict:
    """
    Joint les données (df_region) aux features GeoJSON sur la colonne région normalisée.
    Ajoute les colonnes cols_valeurs dans les propriétés de chaque feature.
    """
    name_field = detect_name_field(geo, niveau)
    if not name_field:
        raise ValueError(f"Champ de nom introuvable pour le niveau {niveau}")

    # Index des données : clé normalisée → dict de valeurs
    index = {}
    for _, row in df_region.iterrows():
        k = cle_admin(str(row[col_region]))
        if k:
            index[k] = {c: row[c] for c in cols_valeurs if c in row}

    geo_out = {"type": "FeatureCollection", "features": []}
    alias_fields = BOUNDARIES[niveau].get("alias_fields", [])
    for feat in geo["features"]:
        props = dict(feat.get("properties", {}))

        noms_candidats = [props.get(name_field, "")]
        for alias in alias_fields:
            if alias in props:
                noms_candidats.append(props.get(alias, ""))

        donnees = {c: None for c in cols_valeurs}
        for nom in noms_candidats:
            k = cle_admin(str(nom))
            if k and k in index:
                donnees = index[k]
                break

        props.update(donnees)
        norm_value = normaliser_region(props.get(name_field, ""))
        key_norm = {
            "regions": "region_norm",
            "provinces": "province_norm",
            "communes": "commune_norm",
        }.get(niveau, "admin_norm")
        props[key_norm] = norm_value
        geo_out["features"].append({
            "type": "Feature",
            "geometry": feat["geometry"],
            "properties": props,
        })
    return geo_out


# ---------------------------------------------------------------------------
# 3. MODULE SÉCURITÉ
# ---------------------------------------------------------------------------

def securite():
    print("\n--- Sécurité ---")
    out = VIZ_DIR / "json" / "securite"
    out.mkdir(exist_ok=True)

    # --- 3a. Courbe évolution temporelle (JSON ECharts) ---
    df = pd.read_csv(DATA_DIR / "Securite/Incidents_securitaires/series_annuelles_bfa_harmonisees.csv")
    df = df.sort_values("annee")
    indicateurs = ["nb_evenements_civils", "nb_deces_civils", "nb_deces_totaux",
                   "nb_violence_politique", "nb_manifestations"]
    obj = {
        "meta": meta(
            "Évolution des incidents sécuritaires — Burkina Faso",
            "nombre",
            "ACLED / HDX — série annuelle 03 avril 2026",
        ),
        "categories": df["annee"].tolist(),
        "series": [
            {
                "nom": ind,
                "data": df[ind].fillna(0).astype(int).tolist(),
            }
            for ind in indicateurs if ind in df.columns
        ],
    }
    sauvegarder_json(obj, out / "courbe_temporelle.json", "Sécurité courbe temporelle")

    # --- 3b. KPI (JSON) : valeurs de la dernière année disponible ---
    derniere = df[df["annee"] == df["annee"].max()].iloc[0]
    kpi = {
        "meta": meta(
            "KPI incidents sécuritaires — Burkina Faso",
            "nombre",
            "ACLED / HDX",
        ),
        "annee_reference": int(derniere["annee"]),
        "indicateurs": {
            ind: int(derniere.get(ind, 0))
            for ind in indicateurs if ind in derniere
        },
    }
    sauvegarder_json(kpi, out / "kpi.json", "Sécurité KPI")

    # --- 3c. Carte thermique incidents (GeoJSON) ---
    df_hrp = pd.read_csv(
        DATA_DIR / "Securite/Incidents_securitaires/incidents_hrp_region_province_mensuel_bfa_clean.csv"
    )
    # Agréger : total par région (toutes années, tous types)
    agg = (
        df_hrp.groupby("region", as_index=False)
        .agg(nb_evenements=("nb_evenements", "sum"), nb_deces=("nb_deces", "sum"))
    )
    agg["region_norm"] = agg["region"].apply(normaliser_region)
    agg = agg[agg["region_norm"].notna() & (agg["region_norm"] != "")]

    # Aussi une version par type × région pour filtrage côté client
    par_type = (
        df_hrp.groupby(["region", "type_evenement"], as_index=False)
        .agg(nb_evenements=("nb_evenements", "sum"), nb_deces=("nb_deces", "sum"))
    )

    geo = charger_geojson("regions")
    if geo:
        geo_out = joindre_donnees_geojson(geo, agg, "region_norm",
                                          ["nb_evenements", "nb_deces"], "regions")
        sauvegarder_json(
            geo_out,
            VIZ_DIR / "geojson" / "securite_carte_incidents.geojson",
            "Sécurité carte incidents (GeoJSON)",
        )

    # --- 3d. Carte incidents par province (GeoJSON ADM2) ---
    agg_province = (
        df_hrp.groupby("province", as_index=False)
        .agg(nb_evenements=("nb_evenements", "sum"), nb_deces=("nb_deces", "sum"))
    )
    agg_province["province_norm"] = agg_province["province"].apply(lambda x: str(x).strip())
    agg_province = agg_province[agg_province["province_norm"] != ""]

    geo_prov = charger_geojson("provinces")
    if geo_prov:
        geo_out_prov = joindre_donnees_geojson(
            geo_prov,
            agg_province,
            "province_norm",
            ["nb_evenements", "nb_deces"],
            "provinces",
        )
        sauvegarder_json(
            geo_out_prov,
            VIZ_DIR / "geojson" / "securite_carte_incidents_provinces.geojson",
            "Sécurité carte incidents provinces (GeoJSON ADM2)",
        )

    # JSON détail par région × type pour les filtres du dashboard
    detail = {}
    for _, row in par_type.iterrows():
        reg = normaliser_region(str(row["region"]))
        if not reg:
            continue
        detail.setdefault(reg, {})[row["type_evenement"]] = {
            "nb_evenements": int(row["nb_evenements"]),
            "nb_deces": int(row["nb_deces"]),
        }
    obj_detail = {
        "meta": meta(
            "Incidents sécuritaires par région et type — Burkina Faso",
            "nombre",
            "ACLED HRP — 1997-2026",
        ),
        "donnees": detail,
    }
    sauvegarder_json(obj_detail, out / "carte_incidents_detail.json", "Sécurité carte incidents (JSON détail)")

    # CSV téléchargement — un fichier par visualisation
    df_hrp.to_csv(VIZ_DIR / "csv" / "securite_incidents_hrp_mensuel.csv", index=False)
    df.to_csv(VIZ_DIR / "csv" / "securite_series_annuelles.csv", index=False)
    par_type.assign(region_norm=par_type["region"].apply(normaliser_region)).to_csv(
        VIZ_DIR / "csv" / "securite_incidents_par_region_type.csv", index=False
    )
    agg.to_csv(VIZ_DIR / "csv" / "securite_incidents_par_region_total.csv", index=False)
    agg_province.to_csv(VIZ_DIR / "csv" / "securite_incidents_par_province_total.csv", index=False)
    print("  [OK] CSV téléchargement sécurité (5 fichiers) → data/viz/csv/")


# ---------------------------------------------------------------------------
# 4. MODULE POPULATION
# ---------------------------------------------------------------------------

def population():
    print("\n--- Population ---")
    out = VIZ_DIR / "json" / "population"
    out.mkdir(exist_ok=True)

    # --- 4a. Courbe évolution PDI (JSON) ---
    df_pdi = pd.read_csv(DATA_DIR / "Population/PDI/pdi-gcorr-burkinafaso-may2025_nettoye.csv",
                         parse_dates=["date_choc"], dayfirst=False)
    df_pdi["annee"] = df_pdi["date_choc"].dt.year
    serie_pdi = (
        df_pdi.groupby("annee", as_index=False)["incident"].sum()
        .sort_values("annee")
    )
    obj_pdi = {
        "meta": meta(
            "Évolution des déplacements de population (PDI) — Burkina Faso",
            "nombre de personnes déplacées",
            "GCORR / OCHA — mai 2025",
        ),
        "categories": serie_pdi["annee"].tolist(),
        "series": [{"nom": "PDI incidents", "data": serie_pdi["incident"].tolist()}],
    }
    sauvegarder_json(obj_pdi, out / "courbe_pdi.json", "Population courbe PDI")

    # --- 4b. Pyramide démographique (JSON ECharts) ---
    df_dem = pd.read_csv(DATA_DIR / "Population/Demographie/demographie_harmonise_global.csv")
    # Filtrer les lignes avec tranches d'âge et sexe renseignés
    cols_age = ["tranche_d_age", "sexe", "valeur", "annee"]
    df_pyr = df_dem.dropna(subset=["tranche_d_age", "sexe"]).copy()
    if len(df_pyr) > 0:
        # Dernière année disponible
        annee_max = df_pyr["annee"].max()
        df_pyr = df_pyr[df_pyr["annee"] == annee_max]
        pyr_pivot = (
            df_pyr.groupby(["tranche_d_age", "sexe"], as_index=False)["valeur"].sum()
        )
        tranches = sorted(pyr_pivot["tranche_d_age"].unique().tolist())
        sexes = pyr_pivot["sexe"].unique().tolist()
        series_pyr = []
        for sexe in sexes:
            vals = []
            for t in tranches:
                row = pyr_pivot[(pyr_pivot["tranche_d_age"] == t) & (pyr_pivot["sexe"] == sexe)]
                vals.append(float(row["valeur"].sum()) if len(row) > 0 else 0)
            series_pyr.append({"nom": str(sexe), "data": vals})
        obj_pyr = {
            "meta": meta(
                f"Pyramide des âges — Burkina Faso ({int(annee_max)})",
                "population",
                "INSD / OpenDataForAfrica",
                f"Données de l'année {int(annee_max)}",
            ),
            "tranches": tranches,
            "series": series_pyr,
        }
        sauvegarder_json(obj_pyr, out / "pyramide_demographique.json", "Population pyramide")

    # --- 4c. Comparaison inter-régionale (JSON) ---
    df_reg = pd.read_csv(
        DATA_DIR / "Population/Demographie/Population_du_Burkina_Faso_par_région_nettoye.csv"
    )
    df_reg["region_norm"] = df_reg["provinces"].apply(normaliser_region)
    df_reg = df_reg[df_reg["region_norm"].notna() & (df_reg["region_norm"] != "")]
    annee_max_reg = df_reg["annee"].max()
    df_latest = df_reg[df_reg["annee"] == annee_max_reg]
    regions_sorted = sorted(df_latest["region_norm"].dropna().unique().tolist())
    series_reg = []
    for ind in df_latest["indicateur"].dropna().unique():
        d = df_latest[df_latest["indicateur"] == ind]
        vals = []
        for reg in regions_sorted:
            row = d[d["region_norm"] == reg]
            vals.append(float(row["valeur"].sum()) if len(row) > 0 else None)
        series_reg.append({"nom": str(ind), "data": vals})
    obj_reg = {
        "meta": meta(
            f"Comparaison inter-régionale de la population — Burkina Faso ({int(annee_max_reg)})",
            "population",
            "INSD",
        ),
        "categories": regions_sorted,
        "series": series_reg,
    }
    sauvegarder_json(obj_reg, out / "comparaison_regionale.json", "Population comparaison régionale")

    # --- 4d. Carte choroplèthe PDI (GeoJSON) ---
    df_pdi_reg = df_pdi.dropna(subset=["r_gion_d_accueil"]).copy()
    df_pdi_reg["region_norm"] = df_pdi_reg["r_gion_d_accueil"].apply(normaliser_region)
    agg_pdi = (
        df_pdi_reg.groupby("region_norm", as_index=False)
        .agg(nb_pdi=("pdi_personne", "sum"))
    )
    geo = charger_geojson("regions")
    if geo:
        geo_out = joindre_donnees_geojson(geo, agg_pdi, "region_norm", ["nb_pdi"], "regions")
        sauvegarder_json(
            geo_out,
            VIZ_DIR / "geojson" / "population_carte_pdi.geojson",
            "Population carte PDI (GeoJSON)",
        )

    # --- 4e. Carte communale PDI (GeoJSON ADM3) ---
    df_pdi_com = df_pdi.dropna(subset=["commune_d_accueil"]).copy()
    df_pdi_com["commune_norm"] = df_pdi_com["commune_d_accueil"].apply(lambda x: str(x).strip())
    df_pdi_com = df_pdi_com[df_pdi_com["commune_norm"] != ""]
    agg_pdi_commune = (
        df_pdi_com.groupby("commune_norm", as_index=False)
        .agg(nb_pdi=("pdi_personne", "sum"), nb_incidents=("incident", "sum"))
    )
    geo_com = charger_geojson("communes")
    if geo_com:
        geo_out_com = joindre_donnees_geojson(
            geo_com,
            agg_pdi_commune,
            "commune_norm",
            ["nb_pdi", "nb_incidents"],
            "communes",
        )
        sauvegarder_json(
            geo_out_com,
            VIZ_DIR / "geojson" / "population_carte_pdi_communes.geojson",
            "Population carte PDI communes (GeoJSON ADM3)",
        )

    # --- 4f. Vulnerabilite des menages : evolution nationale (JSON) ---
    df_pauv_evo = pd.read_csv(
        DATA_DIR / "Population/Vulnerabilite_menages/Evolution_des_indices_de_pauvreté_nettoye.csv"
    )
    rubriques_evo = ["Incidence P0", "Profondeur P1", "Sévérité P2"]
    df_pauv_evo = df_pauv_evo[df_pauv_evo["rubrique"].isin(rubriques_evo)].copy()
    df_pauv_evo = df_pauv_evo.sort_values(["annee", "rubrique"])
    annees_pauv = sorted(df_pauv_evo["annee"].dropna().unique().tolist())
    series_pauv = []
    for rubrique in rubriques_evo:
        d = df_pauv_evo[df_pauv_evo["rubrique"] == rubrique].groupby("annee")["valeur"].mean()
        series_pauv.append({
            "nom": rubrique,
            "data": [round(float(d.get(annee, 0)), 2) for annee in annees_pauv],
        })
    obj_pauv = {
        "meta": meta(
            "Evolution des indices de pauvrete des menages — Burkina Faso",
            "%",
            "INSD / Enquetes conditions de vie des menages",
        ),
        "categories": [int(annee) for annee in annees_pauv],
        "series": series_pauv,
    }
    sauvegarder_json(
        obj_pauv,
        out / "courbe_vulnerabilite_menages.json",
        "Population vulnerabilite menages (courbe)",
    )

    # --- 4g. Vulnerabilite des menages : comparaison regionale + KPI (JSON) ---
    df_pauv_reg = pd.read_csv(
        DATA_DIR / "Population/Vulnerabilite_menages/Indicateurs_de_pauvreté_et_contributions_des_régions_à_la_pauvreté_nettoye.csv"
    )
    rubriques_reg = [
        "Incidence de pauvreté (AA_PO)",
        "Profondeur de pauvreté (AA_P1)",
        "Sévérité de pauvreté (AA_P2)",
    ]
    df_pauv_reg = df_pauv_reg[df_pauv_reg["rubrique"].isin(rubriques_reg)].copy()
    df_pauv_reg["region_norm"] = df_pauv_reg["region"].apply(normaliser_region)
    annee_pauv_reg = int(df_pauv_reg["annee"].max())

    df_pauv_nat = df_pauv_reg[
        (df_pauv_reg["annee"] == annee_pauv_reg) & (df_pauv_reg["region"] == "Burkina Faso")
    ]
    kpi_vuln = {
        row["rubrique"]: round(float(row["valeur"]), 2)
        for _, row in df_pauv_nat.iterrows()
    }
    obj_kpi_vuln = {
        "meta": meta(
            "KPI vulnerabilite des menages — Burkina Faso",
            "%",
            "INSD / Enquetes conditions de vie des menages",
        ),
        "annee_reference": annee_pauv_reg,
        "indicateurs": kpi_vuln,
    }
    sauvegarder_json(
        obj_kpi_vuln,
        out / "kpi_vulnerabilite_menages.json",
        "Population vulnerabilite menages (KPI)",
    )

    df_pauv_regions = df_pauv_reg[
        (df_pauv_reg["annee"] == annee_pauv_reg)
        & df_pauv_reg["region_norm"].notna()
        & (df_pauv_reg["region_norm"] != "")
    ].copy()
    regions_pauv = sorted(df_pauv_regions["region_norm"].unique().tolist())
    series_pauv_reg = []
    for rubrique in rubriques_reg:
        d = df_pauv_regions[df_pauv_regions["rubrique"] == rubrique].groupby("region_norm")["valeur"].mean()
        series_pauv_reg.append({
            "nom": rubrique,
            "data": [round(float(d.get(region, 0)), 2) for region in regions_pauv],
        })
    obj_pauv_reg = {
        "meta": meta(
            f"Comparaison regionale de la vulnerabilite des menages — Burkina Faso ({annee_pauv_reg})",
            "%",
            "INSD / Enquetes conditions de vie des menages",
        ),
        "categories": regions_pauv,
        "series": series_pauv_reg,
    }
    sauvegarder_json(
        obj_pauv_reg,
        out / "comparaison_regionale_vulnerabilite.json",
        "Population vulnerabilite menages (comparaison regionale)",
    )

    # --- 4h. Carte regionale vulnerabilite des menages (GeoJSON) ---
    agg_pauv_region = (
        df_pauv_regions.pivot_table(
            index="region_norm",
            columns="rubrique",
            values="valeur",
            aggfunc="mean",
        )
        .reset_index()
        .rename(
            columns={
                "Incidence de pauvreté (AA_PO)": "incidence_pauvrete",
                "Profondeur de pauvreté (AA_P1)": "profondeur_pauvrete",
                "Sévérité de pauvreté (AA_P2)": "severite_pauvrete",
            }
        )
    )
    if geo:
        geo_out_pauv = joindre_donnees_geojson(
            geo,
            agg_pauv_region,
            "region_norm",
            ["incidence_pauvrete", "profondeur_pauvrete", "severite_pauvrete"],
            "regions",
        )
        sauvegarder_json(
            geo_out_pauv,
            VIZ_DIR / "geojson" / "population_carte_vulnerabilite_menages.geojson",
            "Population carte vulnerabilite menages (GeoJSON)",
        )

    df_pdi.to_csv(VIZ_DIR / "csv" / "population_pdi_detail.csv", index=False)
    serie_pdi.to_csv(VIZ_DIR / "csv" / "population_pdi_annuel.csv", index=False)
    agg_pdi.to_csv(VIZ_DIR / "csv" / "population_pdi_par_region.csv", index=False)
    agg_pdi_commune.to_csv(VIZ_DIR / "csv" / "population_pdi_par_commune.csv", index=False)
    df_reg.to_csv(VIZ_DIR / "csv" / "population_demographie_regionale.csv", index=False)
    if len(df_pyr) > 0:
        pyr_pivot.to_csv(VIZ_DIR / "csv" / "population_pyramide_ages.csv", index=False)
    df_pauv_evo.to_csv(VIZ_DIR / "csv" / "population_vulnerabilite_evolution.csv", index=False)
    df_pauv_nat.to_csv(VIZ_DIR / "csv" / "population_vulnerabilite_kpi.csv", index=False)
    df_pauv_regions.to_csv(VIZ_DIR / "csv" / "population_vulnerabilite_regionale.csv", index=False)
    agg_pauv_region.to_csv(VIZ_DIR / "csv" / "population_vulnerabilite_par_region.csv", index=False)
    print("  [OK] CSV téléchargement population (10 fichiers) → data/viz/csv/")


# ---------------------------------------------------------------------------
# 5. MODULE ÉDUCATION
# ---------------------------------------------------------------------------

def education():
    print("\n--- Éducation ---")
    out = VIZ_DIR / "json" / "education"
    out.mkdir(exist_ok=True)

    # --- 5a. Barres empilées dans le temps (JSON) ---
    df = pd.read_csv(DATA_DIR / "Education/education_harmonisee_global.csv")
    df_nat = df[df["region"].isna() | (df["region"].apply(normaliser_region) == "Burkina Faso")]
    series_temps = []
    annees = sorted(df_nat["annee"].dropna().unique().tolist())
    for ind in df_nat["indicateur"].dropna().unique():
        d = df_nat[df_nat["indicateur"] == ind].groupby("annee")["valeur"].sum()
        vals = [float(d.get(a, 0)) for a in annees]
        series_temps.append({"nom": str(ind), "data": vals})
    obj_temps = {
        "meta": meta(
            "Évolution des indicateurs d'éducation — Burkina Faso",
            "voir indicateur",
            "DGESS/MENAPLN — Annuaire statistique",
        ),
        "categories": [int(a) for a in annees],
        "series": series_temps,
    }
    sauvegarder_json(obj_temps, out / "barres_temporelles.json", "Éducation barres temporelles")

    # --- 5b. KPI fermeture / réouverture (JSON) ---
    df_kpi = pd.read_csv(DATA_DIR / "Education/Acces_numerique/education_acces_numerique_harmonise.csv")
    derniere_a = df_kpi["annee"].max()
    kpi_vals = df_kpi[df_kpi["annee"] == derniere_a].groupby("indicateur")["valeur"].sum().to_dict()
    obj_kpi = {
        "meta": meta(
            "KPI éducation — Burkina Faso",
            "voir indicateur",
            "ITU / ARCEP / DGESS",
        ),
        "annee_reference": int(derniere_a),
        "indicateurs": {str(k): float(v) for k, v in kpi_vals.items()},
    }
    sauvegarder_json(obj_kpi, out / "kpi.json", "Éducation KPI")

    # --- 5c. Comparaison géographique résultats proxy (JSON) ---
    df_geo = pd.read_csv(DATA_DIR / "Education/Ecoles/education_comparaison_geographique.csv")
    df_geo["region_norm"] = df_geo["region"].apply(normaliser_region)
    df_geo = df_geo[df_geo["region_norm"].notna() & (df_geo["region_norm"] != "")]
    regions = sorted(df_geo["region_norm"].dropna().unique().tolist())
    series_geo = []
    for ind in df_geo["indicateur"].dropna().unique():
        d = df_geo[df_geo["indicateur"] == ind].groupby("region_norm")["valeur"].sum()
        vals = [float(d.get(r, 0)) for r in regions]
        series_geo.append({"nom": str(ind), "data": vals})
    obj_geo = {
        "meta": meta(
            "Comparaison géographique des indicateurs d'éducation — Burkina Faso (proxy)",
            "voir indicateur",
            "DGESS/MENAPLN",
            "Données proxy — les résultats scolaires (CEP/BEPC/BAC) ne sont pas géolocalisés. "
            "Ce fichier utilise les données d'écoles comme approximation géographique.",
        ),
        "categories": regions,
        "series": series_geo,
    }
    sauvegarder_json(obj_geo, out / "comparaison_geographique.json", "Éducation comparaison géo (proxy)")

    # --- 5d. Carte écoles (GeoJSON) ---
    df_ecoles = pd.read_csv(DATA_DIR / "Education/Ecoles/education_ecoles_harmonise.csv")
    df_ecoles["region_norm"] = df_ecoles["region"].apply(normaliser_region)
    df_ecoles = df_ecoles[df_ecoles["region_norm"].notna() & (df_ecoles["region_norm"] != "")]
    agg_ecoles = df_ecoles.groupby("region_norm", as_index=False)["valeur"].sum().rename(
        columns={"valeur": "nb_ecoles"}
    )
    geo = charger_geojson("regions")
    if geo:
        geo_out = joindre_donnees_geojson(geo, agg_ecoles, "region_norm", ["nb_ecoles"], "regions")
        sauvegarder_json(
            geo_out,
            VIZ_DIR / "geojson" / "education_carte_ecoles.geojson",
            "Éducation carte écoles (GeoJSON)",
        )

    # --- 5e. Carte écoles par commune (GeoJSON ADM3, avec contrôle de qualité de jointure) ---
    df_ecoles_com = df_ecoles[df_ecoles["commune"].notna()].copy()
    df_ecoles_com["commune_norm"] = df_ecoles_com["commune"].astype(str).str.strip()
    df_ecoles_com = df_ecoles_com[
        (df_ecoles_com["commune_norm"] != "")
        & (df_ecoles_com["commune_norm"].str.lower() != "region")
    ]
    agg_ecoles_commune = df_ecoles_com.groupby("commune_norm", as_index=False)["valeur"].sum().rename(
        columns={"valeur": "nb_ecoles"}
    )
    geo_com = charger_geojson("communes")
    if geo_com and len(agg_ecoles_commune) > 0:
        geo_out_com = joindre_donnees_geojson(
            geo_com,
            agg_ecoles_commune,
            "commune_norm",
            ["nb_ecoles"],
            "communes",
        )

        # Mesure simple de couverture pour éviter d'exposer une couche trop bruitée.
        communes_geo = {
            cle_admin(str(f.get("properties", {}).get("adm3_name", "")))
            for f in geo_com.get("features", [])
        }
        communes_data = {
            cle_admin(str(c)) for c in agg_ecoles_commune["commune_norm"].dropna().tolist()
        }
        communes_data = {c for c in communes_data if c}
        taux_couverture = (
            (len([c for c in communes_data if c in communes_geo]) / len(communes_data))
            if communes_data else 0
        )

        if taux_couverture >= 0.7:
            sauvegarder_json(
                geo_out_com,
                VIZ_DIR / "geojson" / "education_carte_ecoles_communes.geojson",
                "Éducation carte écoles communes (GeoJSON ADM3)",
            )
            agg_ecoles_commune.to_csv(VIZ_DIR / "csv" / "education_ecoles_par_commune.csv", index=False)
            print(f"  [OK] Couche communale éducation publiée (couverture: {round(taux_couverture * 100, 1)}%).")
        else:
            print(f"  [ABSENT] Couche communale éducation non publiée (couverture insuffisante: {round(taux_couverture * 100, 1)}%).")
    else:
        print("  [ABSENT] Couche communale éducation non publiée (pas de données communes exploitables).")

    df_ecoles.to_csv(VIZ_DIR / "csv" / "education_ecoles.csv", index=False)
    df.to_csv(VIZ_DIR / "csv" / "education_indicateurs.csv", index=False)
    df_kpi.to_csv(VIZ_DIR / "csv" / "education_kpi_acces_numerique.csv", index=False)
    df_geo.to_csv(VIZ_DIR / "csv" / "education_comparaison_geographique.csv", index=False)
    agg_ecoles.to_csv(VIZ_DIR / "csv" / "education_ecoles_par_region.csv", index=False)
    print("  [OK] CSV téléchargement éducation (5 fichiers) → data/viz/csv/")


# ---------------------------------------------------------------------------
# 6. MODULE ÉCONOMIE
# ---------------------------------------------------------------------------

def economie():
    print("\n--- Économie ---")
    out = VIZ_DIR / "json" / "economie"
    out.mkdir(exist_ok=True)

    raw_economie_dir = RAW_DATA_DIR / "economie_emploi"

    def lire_csv_brut(path: Path) -> pd.DataFrame:
        df = pd.read_csv(path)
        df.columns = [str(col).strip() for col in df.columns]
        return df

    df_prix = pd.read_csv(DATA_DIR / "Economie/Prix/wfp_food_prices_bfa_nettoye.csv")
    # annee et periode_normalisee déjà présentes dans le fichier nettoyé
    df_prix["region_norm"] = df_prix["region"].apply(normaliser_region)

    # --- 6a. Série temporelle prix (JSON) : prix moyen par période normalisée × produit ---
    col_periode = "periode_normalisee" if "periode_normalisee" in df_prix.columns else "date"
    df_prix["mois"] = df_prix[col_periode].astype(str)
    produits = df_prix["produit"].dropna().unique().tolist()[:10]  # top 10 produits
    categories_mois = sorted(df_prix["mois"].dropna().unique().tolist())
    series_prix = []
    for prod in produits:
        d = (df_prix[df_prix["produit"] == prod]
             .groupby("mois")["prix_local"].mean()
             .reindex(categories_mois))
        series_prix.append({
            "nom": str(prod),
            "data": [round(float(v), 2) if pd.notna(v) else None for v in d],
        })
    obj_prix = {
        "meta": meta(
            "Prix mensuels des denrées alimentaires — Burkina Faso",
            "FCFA",
            "PAM/FAO/Banque mondiale — WFP Food Prices",
        ),
        "categories": categories_mois,
        "series": series_prix,
    }
    sauvegarder_json(obj_prix, out / "serie_prix_denrees.json", "Économie série temporelle prix")

    # --- 6b. Comparaison régionale prix (JSON + GeoJSON) ---
    derniere_annee_prix = df_prix["annee"].max()
    agg_region = (
        df_prix[df_prix["annee"] == derniere_annee_prix]
        .groupby("region_norm", as_index=False)["prix_local"]
        .mean()
        .rename(columns={"prix_local": "prix_moyen"})
    )
    agg_region = agg_region[agg_region["region_norm"].notna() & (agg_region["region_norm"] != "")]

    # JSON barre
    obj_reg_prix = {
        "meta": meta(
            f"Prix alimentaires moyens par région — Burkina Faso ({int(derniere_annee_prix)})",
            "FCFA",
            "PAM/FAO/Banque mondiale",
        ),
        "categories": agg_region["region_norm"].tolist(),
        "series": [
            {"nom": "Prix moyen", "data": [round(float(v), 2) for v in agg_region["prix_moyen"]]}
        ],
    }
    sauvegarder_json(obj_reg_prix, out / "comparaison_regionale_prix.json", "Économie comparaison régionale prix (JSON)")

    geo = charger_geojson("regions")
    if geo:
        geo_out = joindre_donnees_geojson(geo, agg_region, "region_norm", ["prix_moyen"], "regions")
        sauvegarder_json(
            geo_out,
            VIZ_DIR / "geojson" / "economie_carte_prix.geojson",
            "Économie carte prix régionaux (GeoJSON)",
        )

    # --- 6c. Comparaison provinciale prix (GeoJSON ADM2) ---
    agg_province_prix = (
        df_prix[df_prix["annee"] == derniere_annee_prix]
        .groupby("province", as_index=False)["prix_local"]
        .mean()
        .rename(columns={"prix_local": "prix_moyen"})
    )
    agg_province_prix["province_norm"] = agg_province_prix["province"].apply(lambda x: str(x).strip())
    agg_province_prix = agg_province_prix[agg_province_prix["province_norm"] != ""]

    geo_prov = charger_geojson("provinces")
    if geo_prov:
        geo_out_prov = joindre_donnees_geojson(
            geo_prov,
            agg_province_prix,
            "province_norm",
            ["prix_moyen"],
            "provinces",
        )
        sauvegarder_json(
            geo_out_prov,
            VIZ_DIR / "geojson" / "economie_carte_prix_provinces.geojson",
            "Économie carte prix provinciaux (GeoJSON ADM2)",
        )

    # --- 6d. Série emploi / chômage (JSON) ---
    df_emploi_path = DATA_DIR / "Economie/Emploi/Evolution_du_taux_de_chômage_selon_le_milieu_de_résidence_nettoye.csv"
    if df_emploi_path.exists():
        df_emp = pd.read_csv(df_emploi_path)
        annees_emp = sorted(df_emp["annee"].dropna().unique().tolist())
        series_emp = []
        for milieu in df_emp["milieu"].dropna().unique():
            d = df_emp[df_emp["milieu"] == milieu].groupby("annee")["valeur"].mean()
            series_emp.append({"nom": str(milieu), "data": [float(d.get(a, None)) if a in d else None for a in annees_emp]})
        obj_emp = {
            "meta": meta(
                "Évolution du taux de chômage — Burkina Faso",
                "%",
                "INSD / SSN / MFSFN",
            ),
            "categories": [int(a) for a in annees_emp],
            "series": series_emp,
        }
        sauvegarder_json(obj_emp, out / "serie_emploi_chomage.json", "Économie emploi/chômage")
    else:
        print("  [ABSENT] Fichier emploi/chômage introuvable — saut.")

    # --- 6d-bis. Série taux d'emploi (JSON) ---
    path_taux_emploi = raw_economie_dir / "emploi_chomage" / "Taux_chomage-emploi.csv"
    if path_taux_emploi.exists():
        df_taux_emploi = lire_csv_brut(path_taux_emploi)
        df_taux_emploi = df_taux_emploi.rename(
            columns={
                "milieu-de-résidence": "milieu_residence",
                "groupe-d-âges": "groupe_ages",
                "pays": "geographie",
            }
        )
        df_taux_emploi["annee"] = pd.to_numeric(df_taux_emploi["Date"], errors="coerce")
        df_taux_emploi["valeur"] = pd.to_numeric(df_taux_emploi["Value"], errors="coerce")
        df_taux_emploi["indicateur"] = df_taux_emploi["indicateur"].astype(str).str.strip()
        df_taux_emploi["sexe"] = df_taux_emploi["sexe"].astype(str).str.strip()
        df_taux_emploi["geographie"] = df_taux_emploi["geographie"].astype(str).str.strip()
        df_taux_emploi["milieu_residence"] = df_taux_emploi["milieu_residence"].astype(str).str.strip()
        df_taux_emploi["groupe_ages"] = df_taux_emploi["groupe_ages"].astype(str).str.strip()
        df_taux_emploi = df_taux_emploi.dropna(subset=["annee", "valeur"])
        df_taux_emploi["annee"] = df_taux_emploi["annee"].astype(int)

        df_taux_emploi_nat = df_taux_emploi[
            (df_taux_emploi["indicateur"] == "Taux d'emploi (Ratio emploi/Population)")
            & (df_taux_emploi["geographie"] == "Burkina Faso")
            & (df_taux_emploi["milieu_residence"] == "Ensemble")
            & (df_taux_emploi["groupe_ages"] == "Ensemble")
            & (df_taux_emploi["sexe"].isin(["Ensemble", "Homme", "Femme"]))
        ].copy()

        annees_taux_emploi = sorted(df_taux_emploi_nat["annee"].unique().tolist())
        sexe_order = [sexe for sexe in ["Ensemble", "Homme", "Femme"] if sexe in df_taux_emploi_nat["sexe"].unique()]
        obj_taux_emploi = {
            "meta": meta(
                "Évolution du taux d'emploi — Burkina Faso",
                "%",
                "INSD / EMOP / ENEJ",
            ),
            "categories": annees_taux_emploi,
            "series": [
                {
                    "nom": sexe,
                    "data": [
                        round(float(df_taux_emploi_nat[(df_taux_emploi_nat["sexe"] == sexe) & (df_taux_emploi_nat["annee"] == annee)]["valeur"].mean()), 2)
                        if len(df_taux_emploi_nat[(df_taux_emploi_nat["sexe"] == sexe) & (df_taux_emploi_nat["annee"] == annee)]) > 0 else None
                        for annee in annees_taux_emploi
                    ],
                }
                for sexe in sexe_order
            ],
            "annee_reference": int(max(annees_taux_emploi)) if annees_taux_emploi else None,
        }
        sauvegarder_json(obj_taux_emploi, out / "serie_taux_emploi.json", "Économie taux d'emploi")

        df_taux_emploi_reg = df_taux_emploi[
            (df_taux_emploi["indicateur"] == "Taux d'emploi (Ratio emploi/Population)")
            & (df_taux_emploi["geographie"] != "Burkina Faso")
            & (df_taux_emploi["sexe"] == "Ensemble")
            & (df_taux_emploi["milieu_residence"] == "Ensemble")
            & (df_taux_emploi["groupe_ages"] == "Ensemble")
        ].copy()
        if len(df_taux_emploi_reg) > 0:
            df_taux_emploi_reg["region_norm"] = df_taux_emploi_reg["geographie"].apply(normaliser_region)
            annee_reg_emp = int(df_taux_emploi_reg["annee"].max())
            df_taux_emploi_reg = df_taux_emploi_reg[df_taux_emploi_reg["annee"] == annee_reg_emp]
            df_taux_emploi_reg = df_taux_emploi_reg[df_taux_emploi_reg["region_norm"] != ""].sort_values("valeur", ascending=False)
            obj_taux_emploi_reg = {
                "meta": meta(
                    f"Comparaison régionale du taux d'emploi — Burkina Faso ({annee_reg_emp})",
                    "%",
                    "INSD / EMOP / ENEJ",
                ),
                "categories": df_taux_emploi_reg["region_norm"].tolist(),
                "series": [{"nom": "Taux d'emploi", "data": df_taux_emploi_reg["valeur"].round(2).tolist()}],
                "annee_reference": annee_reg_emp,
            }
            sauvegarder_json(obj_taux_emploi_reg, out / "comparaison_regionale_taux_emploi.json", "Économie taux d'emploi régional")

        df_taux_emploi.to_csv(VIZ_DIR / "csv" / "economie_taux_emploi.csv", index=False)
    else:
        print("  [ABSENT] Fichier taux emploi introuvable — saut.")

    # --- 6d-ter. Série taux d'activité et main-d'oeuvre totale (JSON) ---
    path_marche_travail = raw_economie_dir / "emploi_chomage" / "emploi_chomage_afristat.csv"
    if path_marche_travail.exists():
        df_mt = lire_csv_brut(path_marche_travail)
        df_mt = df_mt.rename(columns={"indicateurs": "indicateur", "pays": "geographie"})
        df_mt["annee"] = pd.to_numeric(df_mt["Date"], errors="coerce")
        df_mt["valeur"] = pd.to_numeric(df_mt["Value"], errors="coerce")
        for col in ["indicateur", "geographie", "sexe", "secteur"]:
            df_mt[col] = df_mt[col].astype(str).str.strip()
        df_mt = df_mt.dropna(subset=["annee", "valeur"])
        df_mt["annee"] = df_mt["annee"].astype(int)

        df_activite = df_mt[
            (df_mt["indicateur"] == "Taux d'activité")
            & (df_mt["geographie"] == "Burkina Faso")
            & (df_mt["sexe"].isin(["Ensemble", "Masculin", "Féminin"]))
        ].copy()
        annees_activite = sorted(df_activite["annee"].unique().tolist())
        sexe_activite_order = [sexe for sexe in ["Ensemble", "Masculin", "Féminin"] if sexe in df_activite["sexe"].unique()]
        obj_activite = {
            "meta": meta(
                "Évolution du taux d'activité — Burkina Faso",
                "%",
                "AFRISTAT",
            ),
            "categories": annees_activite,
            "series": [
                {
                    "nom": sexe,
                    "data": [
                        round(float(df_activite[(df_activite["sexe"] == sexe) & (df_activite["annee"] == annee)]["valeur"].mean()), 2)
                        if len(df_activite[(df_activite["sexe"] == sexe) & (df_activite["annee"] == annee)]) > 0 else None
                        for annee in annees_activite
                    ],
                }
                for sexe in sexe_activite_order
            ],
            "annee_reference": int(max(annees_activite)) if annees_activite else None,
        }
        sauvegarder_json(obj_activite, out / "serie_taux_activite.json", "Économie taux d'activité")

        df_mo = df_mt[
            (df_mt["indicateur"] == "Main d'œuvre totale")
            & (df_mt["geographie"] == "Burkina Faso")
        ].copy().sort_values("annee")
        if len(df_mo) > 0:
            obj_mo = {
                "meta": meta(
                    "Évolution de la main-d'œuvre totale — Burkina Faso",
                    "milliers de personnes",
                    "AFRISTAT",
                ),
                "categories": df_mo["annee"].astype(int).tolist(),
                "series": [{"nom": "Main-d'œuvre totale", "data": df_mo["valeur"].round(2).tolist()}],
                "annee_reference": int(df_mo["annee"].max()),
            }
            sauvegarder_json(obj_mo, out / "serie_main_oeuvre_totale.json", "Économie main-d'œuvre totale")

        df_part_feminine = df_mt[
            (df_mt["indicateur"] == "Pourcentage de main d'œuvre féminine")
            & (df_mt["geographie"] == "Burkina Faso")
        ].copy().sort_values("annee")
        if len(df_part_feminine) > 0:
            obj_part_feminine = {
                "meta": meta(
                    "Évolution de la part de main-d'œuvre féminine — Burkina Faso",
                    "%",
                    "AFRISTAT",
                ),
                "categories": df_part_feminine["annee"].astype(int).tolist(),
                "series": [{"nom": "Part de main-d'œuvre féminine", "data": df_part_feminine["valeur"].round(2).tolist()}],
                "annee_reference": int(df_part_feminine["annee"].max()),
            }
            sauvegarder_json(obj_part_feminine, out / "serie_part_main_oeuvre_feminine.json", "Économie part main-d'œuvre féminine")

        df_part_salaries = df_mt[
            (df_mt["indicateur"] == "Pourcentage de travailleurs salariés")
            & (df_mt["geographie"] == "Burkina Faso")
        ].copy().sort_values("annee")
        if len(df_part_salaries) > 0:
            obj_part_salaries = {
                "meta": meta(
                    "Évolution de la part des travailleurs salariés — Burkina Faso",
                    "%",
                    "AFRISTAT",
                ),
                "categories": df_part_salaries["annee"].astype(int).tolist(),
                "series": [{"nom": "Travailleurs salariés", "data": df_part_salaries["valeur"].round(2).tolist()}],
                "annee_reference": int(df_part_salaries["annee"].max()),
            }
            sauvegarder_json(obj_part_salaries, out / "serie_part_travailleurs_salaries.json", "Économie part travailleurs salariés")

        df_mt.to_csv(VIZ_DIR / "csv" / "economie_marche_travail_afristat.csv", index=False)
    else:
        print("  [ABSENT] Fichier marche du travail AFRISTAT introuvable — saut.")

    df_prix.to_csv(VIZ_DIR / "csv" / "economie_prix_alimentaires.csv", index=False)
    agg_region.to_csv(VIZ_DIR / "csv" / "economie_prix_par_region.csv", index=False)
    agg_province_prix.to_csv(VIZ_DIR / "csv" / "economie_prix_par_province.csv", index=False)
    if df_emploi_path.exists():
        df_emp.to_csv(VIZ_DIR / "csv" / "economie_emploi_chomage.csv", index=False)

    # --- 6e. PME : créations CEFORE par âge du promoteur (JSON) ---
    path_age = raw_economie_dir / "pme_entreprises" / "Création des entreprises enregistrées au CEFORE selon l’âge du promoteur.csv"
    if path_age.exists():
        df_age = lire_csv_brut(path_age)
        df_age = df_age.rename(columns={"tranche-d-age": "tranche_age"})
        df_age["annee"] = pd.to_numeric(df_age["Date"], errors="coerce")
        df_age["valeur"] = pd.to_numeric(df_age["Value"], errors="coerce")
        df_age["tranche_age"] = df_age["tranche_age"].astype(str).str.strip()
        df_age = df_age.dropna(subset=["annee", "valeur"])
        df_age["annee"] = df_age["annee"].astype(int)

        annees_age = sorted(df_age["annee"].unique().tolist())
        tranches_age = [
            t for t in ["18 à 30 ans", "30 à 55 ans", "55 ans et plus"]
            if t in df_age["tranche_age"].unique()
        ]
        total_age = df_age[df_age["tranche_age"].str.lower() == "ensemble"]
        age_total_ref = None
        if len(total_age) > 0:
            age_total_ref = int(total_age[total_age["annee"] == total_age["annee"].max()]["valeur"].sum())

        obj_age = {
            "meta": meta(
                "Création des entreprises CEFORE selon l’âge du promoteur — Burkina Faso",
                "nombre d'entreprises",
                "CEFORE",
            ),
            "categories": annees_age,
            "series": [
                {
                    "nom": tranche,
                    "data": [
                        int(df_age[(df_age["tranche_age"] == tranche) & (df_age["annee"] == annee)]["valeur"].sum())
                        for annee in annees_age
                    ],
                }
                for tranche in tranches_age
            ],
            "annee_reference": int(max(annees_age)) if annees_age else None,
            "total_annee_reference": age_total_ref,
        }
        sauvegarder_json(obj_age, out / "pme_age_promoteur.json", "Économie PME âge promoteur")
        df_age.to_csv(VIZ_DIR / "csv" / "economie_pme_age_promoteur.csv", index=False)
    else:
        print("  [ABSENT] Fichier PME âge promoteur introuvable — saut.")

    # --- 6f. PME : répartition par statut juridique (JSON) ---
    path_statut = raw_economie_dir / "pme_entreprises" / " Répartition des entreprises par statut juridique.csv"
    if path_statut.exists():
        df_statut = lire_csv_brut(path_statut)
        df_statut = df_statut.rename(columns={"statut-juridique": "statut_juridique"})
        df_statut["annee"] = pd.to_numeric(df_statut["Date"], errors="coerce")
        df_statut["valeur"] = pd.to_numeric(df_statut["Value"], errors="coerce")
        df_statut["statut_juridique"] = df_statut["statut_juridique"].astype(str).str.strip()
        df_statut = df_statut.dropna(subset=["annee", "valeur"])
        df_statut["annee"] = df_statut["annee"].astype(int)
        annee_statut = int(df_statut["annee"].max())
        df_statut_latest = df_statut[df_statut["annee"] == annee_statut].copy()
        total_statut = int(df_statut_latest[df_statut_latest["statut_juridique"].str.lower() == "total"]["valeur"].sum())
        df_statut_latest = df_statut_latest[
            ~df_statut_latest["statut_juridique"].str.lower().isin(["total", "nd"])
        ].sort_values("valeur", ascending=False)

        obj_statut = {
            "meta": meta(
                "Répartition des entreprises par statut juridique — Burkina Faso",
                "nombre d'entreprises",
                "CEFORE",
            ),
            "annee_reference": annee_statut,
            "categories": df_statut_latest["statut_juridique"].tolist(),
            "series": [
                {
                    "nom": "Entreprises",
                    "data": df_statut_latest["valeur"].astype(int).tolist(),
                }
            ],
            "total_annee_reference": total_statut,
        }
        sauvegarder_json(obj_statut, out / "pme_statut_juridique.json", "Économie PME statut juridique")
        df_statut.to_csv(VIZ_DIR / "csv" / "economie_pme_statut_juridique.csv", index=False)
    else:
        print("  [ABSENT] Fichier PME statut juridique introuvable — saut.")

    # --- 6g. Activités locales : entreprises CEFORE par domaine (JSON) ---
    path_domaines = raw_economie_dir / "activites_economiques_locales" / "Répartition des entreprises enregistrées au CEFORE suivant les domaines d’activités.csv"
    if path_domaines.exists():
        df_domaines = lire_csv_brut(path_domaines)
        df_domaines = df_domaines.rename(columns={"domaine-d-activités": "domaine_activite"})
        df_domaines["annee"] = pd.to_numeric(df_domaines["Date"], errors="coerce")
        df_domaines["valeur"] = pd.to_numeric(df_domaines["Value"], errors="coerce")
        df_domaines["domaine_activite"] = df_domaines["domaine_activite"].astype(str).str.strip()
        df_domaines = df_domaines.dropna(subset=["annee", "valeur"])
        df_domaines["annee"] = df_domaines["annee"].astype(int)

        annees_domaines = sorted(df_domaines["annee"].unique().tolist())
        annee_domaines_ref = int(max(annees_domaines)) if annees_domaines else None
        total_domaines_ref = int(
            df_domaines[
                (df_domaines["annee"] == annee_domaines_ref)
                & (df_domaines["domaine_activite"].str.lower() == "ensemble")
            ]["valeur"].sum()
        ) if annee_domaines_ref else None

        df_domaines_series = df_domaines[df_domaines["domaine_activite"].str.lower() != "ensemble"].copy()
        domaine_order = df_domaines_series[df_domaines_series["annee"] == annee_domaines_ref].sort_values(
            "valeur", ascending=False
        )["domaine_activite"].tolist()

        obj_domaines = {
            "meta": meta(
                "Répartition des entreprises CEFORE par domaine d’activité — Burkina Faso",
                "nombre d'entreprises",
                "CEFORE",
            ),
            "categories": annees_domaines,
            "series": [
                {
                    "nom": domaine,
                    "data": [
                        int(df_domaines_series[(df_domaines_series["domaine_activite"] == domaine) & (df_domaines_series["annee"] == annee)]["valeur"].sum())
                        for annee in annees_domaines
                    ],
                }
                for domaine in domaine_order
            ],
            "annee_reference": annee_domaines_ref,
            "total_annee_reference": total_domaines_ref,
        }
        sauvegarder_json(obj_domaines, out / "activites_domaines_cefore.json", "Économie activités domaines CEFORE")
        df_domaines.to_csv(VIZ_DIR / "csv" / "economie_activites_domaines_cefore.csv", index=False)
    else:
        print("  [ABSENT] Fichier activités par domaine introuvable — saut.")

    # --- 6h. Activités locales : travailleurs par branche et sexe (JSON) ---
    path_travailleurs = raw_economie_dir / "activites_economiques_locales" / "Répartition des travailleurs par branches d'activités selon le sexe.csv"
    if path_travailleurs.exists():
        df_trav = lire_csv_brut(path_travailleurs)
        df_trav["annee"] = pd.to_numeric(df_trav["Date"], errors="coerce")
        df_trav["valeur"] = pd.to_numeric(df_trav["Value"], errors="coerce")
        df_trav["branche"] = df_trav["branche"].astype(str).str.strip()
        df_trav["sexe"] = df_trav["sexe"].astype(str).str.strip()
        df_trav = df_trav.dropna(subset=["annee", "valeur"])
        df_trav["annee"] = df_trav["annee"].astype(int)
        annee_trav_ref = int(df_trav["annee"].max())
        df_trav_latest = df_trav[
            (df_trav["annee"] == annee_trav_ref)
            & (df_trav["branche"].str.lower() != "ensemble")
        ].copy()
        branche_order = df_trav_latest[df_trav_latest["sexe"].str.lower() == "ensemble"].sort_values(
            "valeur", ascending=False
        )["branche"].tolist()
        if not branche_order:
            branche_order = (
                df_trav_latest.groupby("branche", as_index=False)["valeur"].sum()
                .sort_values("valeur", ascending=False)["branche"].tolist()
            )
        branche_order = branche_order[:10]

        sexe_order = [sexe for sexe in ["Homme", "Femme", "Ensemble"] if sexe in df_trav_latest["sexe"].unique()]
        obj_trav = {
            "meta": meta(
                "Répartition des travailleurs par branche d’activité et sexe — Burkina Faso",
                "% des travailleurs",
                "INSD / AFRISTAT",
            ),
            "annee_reference": annee_trav_ref,
            "categories": branche_order,
            "series": [
                {
                    "nom": sexe,
                    "data": [
                        round(float(df_trav_latest[(df_trav_latest["sexe"] == sexe) & (df_trav_latest["branche"] == branche)]["valeur"].sum()), 2)
                        for branche in branche_order
                    ],
                }
                for sexe in sexe_order
            ],
        }
        sauvegarder_json(obj_trav, out / "activites_travailleurs_branche_sexe.json", "Économie travailleurs par branche/sexe")
        df_trav.to_csv(VIZ_DIR / "csv" / "economie_travailleurs_branche_sexe.csv", index=False)
    else:
        print("  [ABSENT] Fichier travailleurs par branche/sexe introuvable — saut.")

    # --- 6i. Activités locales : chiffre d'affaires moyen par branche (JSON) ---
    path_ca = raw_economie_dir / "activites_economiques_locales" / "Chiffre d’affaire moyen par branche d’activité en million de FCFA.csv"
    if path_ca.exists():
        df_ca = lire_csv_brut(path_ca)
        df_ca = df_ca.rename(columns={"branche-d-activité": "branche_activite"})
        df_ca["annee"] = pd.to_numeric(df_ca["Date"], errors="coerce")
        df_ca["valeur"] = pd.to_numeric(df_ca["Value"], errors="coerce")
        df_ca["branche_activite"] = df_ca["branche_activite"].astype(str).str.strip()
        df_ca = df_ca.dropna(subset=["annee", "valeur"])
        df_ca["annee"] = df_ca["annee"].astype(int)
        annee_ca_ref = int(df_ca["annee"].max())
        df_ca_latest = df_ca[
            (df_ca["annee"] == annee_ca_ref)
            & (df_ca["branche_activite"].str.upper() != "ND")
        ].sort_values("valeur", ascending=False).head(10)

        obj_ca = {
            "meta": meta(
                "Chiffre d'affaires moyen par branche d’activité — Burkina Faso",
                "FCFA",
                "CEFORE / répertoire des entreprises",
            ),
            "annee_reference": annee_ca_ref,
            "categories": df_ca_latest["branche_activite"].tolist(),
            "series": [
                {
                    "nom": "Chiffre d'affaires moyen",
                    "data": df_ca_latest["valeur"].astype(float).round(2).tolist(),
                }
            ],
        }
        sauvegarder_json(obj_ca, out / "activites_chiffre_affaires_branche.json", "Économie chiffre d'affaires par branche")
        df_ca.to_csv(VIZ_DIR / "csv" / "economie_chiffre_affaires_branche.csv", index=False)
    else:
        print("  [ABSENT] Fichier chiffre d'affaires par branche introuvable — saut.")

    print("  [OK] CSV téléchargement économie (11 fichiers) → data/viz/csv/")


# ---------------------------------------------------------------------------
# 7. MODULE SANTÉ
# ---------------------------------------------------------------------------

def sante():
    print("\n--- Santé ---")
    out = VIZ_DIR / "json" / "sante"
    out.mkdir(exist_ok=True)

    df_global = pd.read_csv(DATA_DIR / "Sante/sante_harmonisee_global.csv")

    # --- 7a. Courbe couverture sanitaire (JSON) ---
    df_couv = df_global[df_global["sous_domaine"].str.contains("couverture", case=False, na=False)]
    annees_couv = sorted(df_couv["annee"].dropna().unique().tolist())
    series_couv = []
    for ind in df_couv["indicateur"].dropna().unique():
        d = df_couv[df_couv["indicateur"] == ind].groupby("annee")["valeur"].mean()
        series_couv.append({
            "nom": str(ind),
            "data": [float(d.get(a, None)) if a in d else None for a in annees_couv],
        })
    obj_couv = {
        "meta": meta(
            "Évolution de la couverture sanitaire — Burkina Faso",
            "voir indicateur",
            "INSD / EDS / DGESS",
        ),
        "categories": [int(a) for a in annees_couv],
        "series": series_couv,
    }
    sauvegarder_json(obj_couv, out / "courbe_couverture.json", "Santé courbe couverture")

    # --- 7b. KPI indicateurs épidémiologiques (JSON) ---
    df_epi = df_global[df_global["sous_domaine"].str.contains("epidemio", case=False, na=False)]
    derniere_epi = df_epi["annee"].max()
    kpi_epi = df_epi[df_epi["annee"] == derniere_epi].groupby("indicateur")["valeur"].mean().to_dict()
    obj_epi = {
        "meta": meta(
            "Indicateurs épidémiologiques — Burkina Faso",
            "voir indicateur",
            "INSD / DGESS / Ministère de la Santé",
        ),
        "annee_reference": int(derniere_epi),
        "indicateurs": {str(k): round(float(v), 4) for k, v in kpi_epi.items()},
    }
    sauvegarder_json(obj_epi, out / "kpi_epidemiologie.json", "Santé KPI épidémiologie")

    # --- 7c. Carte accessibilité (GeoJSON) ---
    df_acc = pd.read_csv(DATA_DIR / "Sante/Infrastructures/sante_accessibilite_region.csv")
    df_acc["region_norm"] = df_acc["region"].apply(normaliser_region)
    df_acc = df_acc[df_acc["region_norm"].notna() & (df_acc["region_norm"] != "")]
    # Utiliser la dernière année disponible
    derniere_acc = df_acc["annee"].max()
    df_acc_latest = df_acc[df_acc["annee"] == derniere_acc]
    agg_acc = df_acc_latest.groupby("region_norm", as_index=False)["valeur"].sum().rename(
        columns={"valeur": "nb_centres"}
    )
    geo = charger_geojson("regions")
    if geo:
        geo_out = joindre_donnees_geojson(geo, agg_acc, "region_norm", ["nb_centres"], "regions")
        sauvegarder_json(
            geo_out,
            VIZ_DIR / "geojson" / "sante_carte_accessibilite.geojson",
            "Santé carte accessibilité (GeoJSON)",
        )

    # JSON barre pour comparaison régionale alternative
    agg_acc_sorted = agg_acc.sort_values("nb_centres", ascending=False)
    obj_acc_bar = {
        "meta": meta(
            f"Centres de santé par région — Burkina Faso ({int(derniere_acc)})",
            "nombre de centres",
            "DGESS / Ministère de la Santé",
        ),
        "categories": agg_acc_sorted["region_norm"].tolist(),
        "series": [{"nom": "Centres de santé", "data": agg_acc_sorted["nb_centres"].tolist()}],
    }
    sauvegarder_json(obj_acc_bar, out / "centres_sante_region.json", "Santé centres par région")

    df_global.to_csv(VIZ_DIR / "csv" / "sante_indicateurs.csv", index=False)
    df_couv.to_csv(VIZ_DIR / "csv" / "sante_couverture_sanitaire.csv", index=False)
    df_epi[df_epi["annee"] == derniere_epi].to_csv(
        VIZ_DIR / "csv" / "sante_kpi_epidemiologie.csv", index=False
    )
    df_acc.to_csv(VIZ_DIR / "csv" / "sante_infrastructures.csv", index=False)
    agg_acc.to_csv(VIZ_DIR / "csv" / "sante_centres_par_region.csv", index=False)
    print("  [OK] CSV téléchargement santé (5 fichiers) → data/viz/csv/")


# ---------------------------------------------------------------------------
# 8. Manifeste des fichiers produits (index pour le frontend)
# ---------------------------------------------------------------------------

def generer_manifeste():
    manifeste = {
        "mise_a_jour": TODAY,
        "note": "Fichiers prêts dashboard V1 — CSV pour téléchargement, JSON pour graphiques ECharts, GeoJSON pour cartes Leaflet.",
        "modules": {},
    }

    for module_dir in sorted((VIZ_DIR / "json").iterdir()):
        if module_dir.is_dir():
            fichiers = [f.name for f in sorted(module_dir.glob("*.json"))]
            manifeste["modules"][module_dir.name] = {"json": fichiers}

    manifeste["geojson"] = [f.name for f in sorted((VIZ_DIR / "geojson").glob("*.geojson"))
                            if not f.name.startswith("bfa_")]
    manifeste["geojson_adm2"] = [
        f.name for f in sorted((VIZ_DIR / "geojson").glob("*.geojson"))
        if "province" in f.name.lower() and not f.name.startswith("bfa_")
    ]
    manifeste["geojson_adm3"] = [
        f.name for f in sorted((VIZ_DIR / "geojson").glob("*.geojson"))
        if "commune" in f.name.lower() and not f.name.startswith("bfa_")
    ]
    manifeste["boundaries"] = [f.name for f in sorted((VIZ_DIR / "geojson").glob("bfa_*.geojson"))]
    manifeste["csv"] = [f.name for f in sorted((VIZ_DIR / "csv").glob("*.csv"))]
    manifeste["tableaux"] = [f.name for f in sorted((VIZ_DIR / "csv").glob("*.csv"))]
    manifeste["tableaux"] += [f.name for f in sorted((VIZ_DIR / "csv").glob("*.xlsx"))]

    sauvegarder_json(manifeste, VIZ_DIR / "manifeste.json", "Manifeste général")


def synchroniser_viz_vers_public():
    """Synchronise data/viz -> public/data/viz pour la diffusion frontend."""
    PUBLIC_VIZ_DIR.parent.mkdir(parents=True, exist_ok=True)
    if PUBLIC_VIZ_DIR.exists():
        shutil.rmtree(PUBLIC_VIZ_DIR)
    shutil.copytree(VIZ_DIR, PUBLIC_VIZ_DIR)
    print("  [OK] data/viz synchronisé vers public/data/viz")


def synchroniser_cleaned_non_viz_vers_public():
    """Copie les fichiers nettoyés non visualisés vers public/data/cleaned."""
    if PUBLIC_CLEANED_DIR.exists():
        shutil.rmtree(PUBLIC_CLEANED_DIR)
    PUBLIC_CLEANED_DIR.mkdir(parents=True, exist_ok=True)

    allowed_ext = {".csv", ".json", ".geojson", ".xlsx"}
    copied = 0
    for src in DATA_DIR.rglob("*"):
        if not src.is_file():
            continue
        if src.suffix.lower() not in allowed_ext:
            continue
        if VIZ_DIR in src.parents:
            continue

        rel = src.relative_to(DATA_DIR)
        dst = PUBLIC_CLEANED_DIR / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1

    print(f"  [OK] {copied} fichiers nettoyés (hors viz) synchronisés vers public/data/cleaned")


def synchroniser_raw_vers_public():
    """Copie les sources primaires raw vers public/data/raw pour diffusion contrôlée."""
    if not RAW_DATA_DIR.exists():
        print(f"  [ABSENT] Dossier raw introuvable ({RAW_DATA_DIR.relative_to(ROOT)}) — saut.")
        return

    if PUBLIC_RAW_DIR.exists():
        shutil.rmtree(PUBLIC_RAW_DIR)
    PUBLIC_RAW_DIR.mkdir(parents=True, exist_ok=True)

    allowed_ext = {".csv", ".json", ".geojson", ".xlsx"}
    copied = 0
    for src in RAW_DATA_DIR.rglob("*"):
        if not src.is_file():
            continue
        if src.suffix.lower() not in allowed_ext:
            continue

        rel = src.relative_to(RAW_DATA_DIR)
        dst = PUBLIC_RAW_DIR / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied += 1

    print(f"  [OK] {copied} fichiers raw synchronisés vers public/data/raw")


def generer_catalogue_auto():
    """Génère un catalogue automatique fusionnant viz + fichiers nettoyés non visualisés."""
    entries: list[dict] = []
    seen_ids: set[str] = set()

    def add_entry(entry: dict):
        if entry["id"] in seen_ids:
            return
        seen_ids.add(entry["id"])
        entries.append(entry)

    # 1) Jeux visualisés / diffusés (depuis data/viz)
    for src in sorted((VIZ_DIR / "csv").glob("*.csv")):
        stem = src.stem
        domain = infer_domain_from_name(stem)
        dataset_id = f"viz-{slugify_name(stem)}"
        add_entry({
            "id": dataset_id,
            "title": humanize_stem(stem),
            "description": "Jeu de données diffusé pour visualisation et téléchargement.",
            "domain": domain,
            "domainLabel": format_domain_label(domain),
            "organization": "CITADEL",
            "region": "National",
            "format": "CSV",
            "status": "actif",
            "updatedLabel": "Automatique",
            "updatedAt": TODAY,
            "rows": count_csv_rows(src),
            "variables": 0,
            "sizeMb": file_size_mb(src),
            "license": "CC BY 4.0",
            "coverage": "National",
            "collectionPeriod": "Non specifie",
            "methodology": "Transformation automatique data/viz",
            "apiPath": "",
            "contact": "contact@citadel.bf",
            "detailEnabled": False,
            "origin": "viz",
            "downloads": [
                {
                    "label": "CSV",
                    "href": f"data/viz/csv/{src.name}",
                    "size": f"{file_size_mb(src)} MB",
                }
            ],
            "sample": [],
        })

    # 2) Jeux nettoyés non visualisés (depuis data/, hors data/viz)
    allowed_ext = {".csv", ".json", ".geojson", ".xlsx"}
    for src in sorted(DATA_DIR.rglob("*")):
        if not src.is_file() or src.suffix.lower() not in allowed_ext:
            continue
        if VIZ_DIR in src.parents:
            continue

        rel = src.relative_to(DATA_DIR)
        stem = src.stem
        domain = infer_domain_from_name(str(rel.parts[0]) if rel.parts else stem)
        dataset_id = f"cleaned-{slugify_name(str(rel).replace('/', '-'))}"

        file_format = src.suffix.replace(".", "").upper()
        rows = count_csv_rows(src) if src.suffix.lower() == ".csv" else 0

        add_entry({
            "id": dataset_id,
            "title": humanize_stem(stem),
            "description": "Jeu de données nettoyé disponible en diffusion, non branché dans les visualisations.",
            "domain": domain,
            "domainLabel": format_domain_label(domain),
            "organization": "CITADEL",
            "region": "National",
            "format": file_format,
            "status": "non_visualise",
            "updatedLabel": "Automatique",
            "updatedAt": TODAY,
            "rows": rows,
            "variables": 0,
            "sizeMb": file_size_mb(src),
            "license": "CC BY 4.0",
            "coverage": "National",
            "collectionPeriod": "Non specifie",
            "methodology": "Pipeline cleaning data/",
            "apiPath": "",
            "contact": "contact@citadel.bf",
            "detailEnabled": False,
            "origin": "cleaned_non_viz",
            "downloads": [
                {
                    "label": f"{file_format}",
                    "href": f"data/cleaned/{rel.as_posix()}",
                    "size": f"{file_size_mb(src)} MB",
                }
            ],
            "sample": [],
        })

    payload = {
        "mise_a_jour": TODAY,
        "source": "catalogue_auto",
        "total": len(entries),
        "datasets": sorted(entries, key=lambda x: (x.get("domain", ""), x.get("title", ""))),
    }

    CATALOG_PATH_DATA.parent.mkdir(parents=True, exist_ok=True)
    CATALOG_PATH_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    sauvegarder_json(payload, CATALOG_PATH_DATA, "Catalogue auto (data/viz)")
    sauvegarder_json(payload, CATALOG_PATH_PUBLIC, "Catalogue auto (public/data)")


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("Conversion données → JSON/GeoJSON pour dashboard V1")
    print("=" * 60)
    print(f"Source cleaned: {DATA_DIR.relative_to(ROOT)}")
    print(f"Source raw: {RAW_DATA_DIR.relative_to(ROOT)}")

    print("\n[1/8] Téléchargement boundaries géographiques...")
    telecharger_boundaries()

    print("\n[2/8] Synchronisation des fichiers admin de référence...")
    synchroniser_fichiers_admin_references()

    print("\n[3/8] Module Sécurité")
    securite()

    print("\n[4/8] Module Population")
    population()

    print("\n[5/8] Module Éducation")
    education()

    print("\n[6/8] Module Économie")
    economie()

    print("\n[7/8] Module Santé")
    sante()

    print("\n[8/11] Génération du manifeste")
    generer_manifeste()

    print("\n[9/11] Génération du catalogue automatique")
    generer_catalogue_auto()

    print("\n[10/11] Synchronisation data/viz -> public/data/viz")
    synchroniser_viz_vers_public()

    print("\n[11/12] Synchronisation data nettoyé (hors viz) -> public/data/cleaned")
    synchroniser_cleaned_non_viz_vers_public()

    print("\n[12/12] Synchronisation data raw -> public/data/raw")
    synchroniser_raw_vers_public()

    print("\n" + "=" * 60)
    print(f"Terminé — fichiers dans {VIZ_DIR.relative_to(ROOT)}/")
    print("=" * 60)
