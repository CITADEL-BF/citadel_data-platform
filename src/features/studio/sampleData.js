/**
 * Petit jeu d'exemple pour tester la fonctionnalite sans fichier sous la main.
 * Volontairement varie : annee (date), region (categorie / geo nommee),
 * valeurs numeriques, latitude / longitude.
 */

export const SAMPLE_CSV = `annee,region,population,pib_par_habitant,latitude,longitude
2019,Centre,2886000,780,12.37,-1.53
2019,Hauts-Bassins,2238000,540,11.18,-4.29
2019,Sahel,1447000,310,14.05,-0.15
2019,Est,1720000,360,12.05,0.36
2020,Centre,2975000,760,12.37,-1.53
2020,Hauts-Bassins,2305000,525,11.18,-4.29
2020,Sahel,1489000,295,14.05,-0.15
2020,Est,1771000,348,12.05,0.36
2021,Centre,3066000,795,12.37,-1.53
2021,Hauts-Bassins,2374000,552,11.18,-4.29
2021,Sahel,1533000,302,14.05,-0.15
2021,Est,1824000,355,12.05,0.36
`

export const SAMPLE_FILE_NAME = 'exemple_regions_burkina.csv'

/**
 * Second exemple, pense pour tester la vue "Pyramide des ages" : une colonne
 * binaire (sexe) x une colonne tranche d'age x une mesure.
 */
export const SAMPLE_PYRAMID_CSV = `tranche_age,sexe,population
0-4,Hommes,1850000
0-4,Femmes,1820000
5-9,Hommes,1720000
5-9,Femmes,1700000
10-14,Hommes,1580000
10-14,Femmes,1560000
15-19,Hommes,1400000
15-19,Femmes,1390000
20-24,Hommes,1180000
20-24,Femmes,1200000
25-29,Hommes,980000
25-29,Femmes,1010000
30-34,Hommes,820000
30-34,Femmes,850000
35-39,Hommes,690000
35-39,Femmes,710000
40-44,Hommes,560000
40-44,Femmes,580000
45-49,Hommes,450000
45-49,Femmes,470000
50-54,Hommes,360000
50-54,Femmes,380000
55-59,Hommes,280000
55-59,Femmes,300000
60-64,Hommes,210000
60-64,Femmes,230000
65+,Hommes,320000
65+,Femmes,380000
`

export const SAMPLE_PYRAMID_FILE_NAME = 'exemple_pyramide_ages.csv'
