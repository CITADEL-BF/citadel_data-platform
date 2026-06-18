#!/usr/bin/env python3
"""
calculer_totaux_regions.py
--------------------------
Calcule des métriques de concentration par région du Burkina Faso
à partir des fichiers data/viz/csv et data/viz/json.

Métriques :
    1. observations_valides : nombre d'observations valides agrégées par région.
    2. indicateurs_distincts : nombre d'indicateurs distincts observés par région.
    3. score_mixte : combinaison couverture fichiers + volume normalisé.

Formule du score mixte :
    score_mixte = 0.40 * couverture_norm + 0.60 * volume_norm
    où couverture_norm et volume_norm sont normalisés sur 0-100.
"""
import csv
import json
from collections import defaultdict
from datetime import date
from pathlib import Path
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
CSV_DIR = ROOT / "data" / "viz" / "csv"
JSON_DIR = ROOT / "data" / "viz" / "json"
OUTPUT_PATH = ROOT / "public" / "data" / "home" / "regions.json"

WEIGHT_COVERAGE = 0.40
WEIGHT_VOLUME = 0.60

CANONICAL_ORDER = [
    "centre",
    "hauts-bassins",
    "nord",
    "est",
    "sahel",
    "centre-nord",
    "centre-est",
    "centre-ouest",
    "cascades",
    "boucle",
    "plateau",
    "centre-sud",
    "sud-ouest",
]

REGION_DISPLAY = {
    "centre": "Région Centre",
    "hauts-bassins": "Hauts-Bassins",
    "nord": "Nord",
    "est": "Est",
    "sahel": "Sahel",
    "centre-nord": "Centre-Nord",
    "centre-est": "Centre-Est",
    "centre-ouest": "Centre-Ouest",
    "cascades": "Cascades",
    "boucle": "Boucle du Mouhoun",
    "plateau": "Plateau Central",
    "centre-sud": "Centre-Sud",
    "sud-ouest": "Sud-Ouest",
}

ALIASES = {
    "centre": "centre",
    "hauts-bassins": "hauts-bassins",
    "nord": "nord",
    "est": "est",
    "sahel": "sahel",
    "centre-nord": "centre-nord",
    "centre-est": "centre-est",
    "centre-ouest": "centre-ouest",
    "centre-sud": "centre-sud",
    "cascades": "cascades",
    "boucle-du-mouhoun": "boucle",
    "boucle": "boucle",
    "plateau-central": "plateau",
    "plateau": "plateau",
    "sud-ouest": "sud-ouest",
    "region-centre": "centre",
}

REGION_KEYS = {
    "region",
    "region_norm",
    "code_region",
    "r_gion_d_accueil",
}

INDICATOR_KEYS = {
    "indicateur",
    "indicateur_source",
    "type_evenement",
    "categorie_1",
    "categorie",
    "variable",
    "nom_serie",
    "serie",
    "kpi",
}

META_KEYS = REGION_KEYS | {
    "province",
    "commune",
    "localite",
    "pays",
    "source",
    "source_fichier",
    "fichier_source",
    "annee",
    "annee_ref",
    "date",
    "date_source",
    "periode",
    "periode_normalisee",
    "mois",
    "id",
    "code",
    "code_region",
    "latitude",
    "longitude",
    "lat",
    "lon",
    "geom",
}

def normalize_text(value: str) -> str:
    txt = unicodedata.normalize("NFD", str(value))
    txt = "".join(ch for ch in txt if unicodedata.category(ch) != "Mn")
    txt = txt.lower()
    out = []
    prev_dash = False
    for ch in txt:
        if ch.isalnum():
            out.append(ch)
            prev_dash = False
        else:
            if not prev_dash:
                out.append("-")
            prev_dash = True
    return "".join(out).strip("-")


def region_code_from_value(value: str):
    norm = normalize_text(value)
    return ALIASES.get(norm)


# Résultat principal
FILE_COVERAGE = defaultdict(set)      # region -> {file_id}
INDICATORS = defaultdict(set)         # region -> {indicator}
OBSERVATIONS = defaultdict(int)       # region -> int


def _safe_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)

    txt = str(value).strip()
    if not txt:
        return None
    if txt.lower() in {"na", "n/a", "null", "none", "nan", "-"}:
        return None

    txt = txt.replace(" ", "").replace("\u00a0", "")
    if "," in txt and "." not in txt:
        txt = txt.replace(",", ".")
    else:
        txt = txt.replace(",", "")

    try:
        return float(txt)
    except ValueError:
        return None


def _extract_indicator_name(row: dict, file_stem: str) -> str:
    for key, value in row.items():
        if normalize_text(key) in INDICATOR_KEYS and str(value or "").strip():
            return str(value).strip()
    return file_stem


def _has_valid_measure(row: dict) -> bool:
    for key, value in row.items():
        norm_key = normalize_text(key)
        if norm_key in META_KEYS:
            continue
        if _safe_number(value) is not None:
            return True
    return False


def _register(region_code: str, file_id: str, indicator: str):
    FILE_COVERAGE[region_code].add(file_id)
    INDICATORS[region_code].add(indicator)
    OBSERVATIONS[region_code] += 1


def add_from_csv():
    for csv_path in CSV_DIR.glob("*.csv"):
        file_id = f"csv:{csv_path.stem}"

        with csv_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or []
            region_cols     = [k for k in fieldnames if normalize_text(k) in REGION_KEYS]

            if not region_cols:
                continue

            for row in reader:
                region_code = None
                for key in region_cols:
                    region_code = region_code_from_value((row.get(key) or "").strip())
                    if region_code:
                        break
                if not region_code:
                    continue

                if not _has_valid_measure(row):
                    continue

                indicator = _extract_indicator_name(row, csv_path.stem)
                _register(region_code, file_id, normalize_text(indicator))


def add_from_json():
    for json_path in JSON_DIR.glob("**/*.json"):
        file_id = f"json:{json_path.stem}"
        try:
            payload = json.loads(json_path.read_text(encoding="utf-8"))
        except Exception:
            continue

        if not isinstance(payload, dict):
            continue

        categories = payload.get("categories")
        series     = payload.get("series")

        if not isinstance(categories, list) or not isinstance(series, list):
            continue

        for idx, category in enumerate(categories):
            region_code = region_code_from_value(category)
            if not region_code:
                continue

            for serie in series:
                if not isinstance(serie, dict):
                    continue
                data = serie.get("data")
                if not isinstance(data, list) or idx >= len(data):
                    continue
                value = data[idx]
                if _safe_number(value) is None:
                    continue
                indicator = normalize_text(serie.get("nom") or serie.get("name") or json_path.stem)
                _register(region_code, file_id, indicator)


def build_output() -> dict:
    coverage = {code: len(FILE_COVERAGE.get(code, set())) for code in CANONICAL_ORDER}
    observations = {code: OBSERVATIONS.get(code, 0) for code in CANONICAL_ORDER}
    indicators = {code: len(INDICATORS.get(code, set())) for code in CANONICAL_ORDER}

    max_coverage = max(coverage.values()) if coverage else 1
    max_observations = max(observations.values()) if observations else 1

    if max_coverage <= 0:
        max_coverage = 1
    if max_observations <= 0:
        max_observations = 1

    regions = []
    for code in CANONICAL_ORDER:
        cov = coverage[code]
        obs = observations[code]
        ind = indicators[code]

        coverage_norm = round((cov / max_coverage) * 100, 2)
        volume_norm = round((obs / max_observations) * 100, 2)
        score_mixte = round((WEIGHT_COVERAGE * coverage_norm) + (WEIGHT_VOLUME * volume_norm), 2)
        indice = round(score_mixte)

        regions.append({
            "code":    code,
            "nom":     REGION_DISPLAY[code],
            "datasets": obs,
            "observations_valides": obs,
            "indicateurs_distincts": ind,
            "couverture_fichiers": cov,
            "score_mixte": score_mixte,
            "couverture_norm": coverage_norm,
            "volume_norm": volume_norm,
            "indice":  indice,
        })

    return {
        "source": "INSD / CITADEL",
        "date_mise_a_jour": date.today().isoformat(),
        "niveau_geo": "region",
        "statut_qualite": "valide",
        "methode_calcul": (
            "Métriques par région: (1) observations valides agrégées, "
            "(2) indicateurs distincts, (3) score mixte = "
            f"{WEIGHT_COVERAGE:.2f}*couverture_fichiers_normalisee + "
            f"{WEIGHT_VOLUME:.2f}*volume_observations_normalise. "
            "Indice UI = arrondi du score mixte sur 0–100."
        ),
        "regions": regions,
    }


def main():
    add_from_csv()
    add_from_json()
    output = build_output()

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"{'RÉGION':<22} {'OBS':>7}  {'IND':>5}  {'COV':>5}  {'MIXTE':>7}  {'INDICE':>6}")
    print("-" * 70)
    for r in output["regions"]:
        print(
            f"{r['nom']:<22} "
            f"{r['observations_valides']:>7}  "
            f"{r['indicateurs_distincts']:>5}  "
            f"{r['couverture_fichiers']:>5}  "
            f"{r['score_mixte']:>7.2f}  "
            f"{r['indice']:>5}%"
        )


if __name__ == "__main__":
    main()
