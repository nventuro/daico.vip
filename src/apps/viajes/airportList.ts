// Written by `npm run airports:generate` from the OurAirports dataset (public
// domain, https://ourairports.com/data/) as it stood on 2026-09-21. Never edited by
// hand: a name that reads wrong is put right in the script's names and the file
// written again.

/** Every airport a ticket can name, a line each: its IATA code, a space, and
 *  what it is called. The ones a ticket is likeliest to name come first. */
export const AIRPORT_LINES = `AAC El Arish
AAE Annaba
AAL Aalborg
AAN Al Ain
AAR Aarhus
ABA Abakan
ABB Asaba
ABD Abadan
ABJ Abidjan
ABQ Albuquerque
ABV Abuja
ABZ Aberdeen (Reino Unido)
ACA Acapulco
ACC Accra
ACE Lanzarote
ADB İzmir
ADD Addis Ababa
ADE Aden
ADJ Amman (Marka)
ADL Adelaide
ADZ San Andrés
AEP Buenos Aires (Aeroparque)
AER Sochi
AES Ålesund
AEY Akureyri
AGA Agadir
AGP Málaga
AGT Ciudad del Este
AGU Aguascalientes
AHB Abha
AJF Al-Jawf
AKL Auckland
AKX Aktobe
ALA Almaty
ALB Albany (Nueva York)
ALC Alicante
ALG Alger
ALP Aleppo
AMD Ahmedabad
AMM Amman (Queen Alia)
AMQ Ambon
AMS Amsterdam
ANC Anchorage
ANF Antofagasta
ANU Antigua
AOE Eskişehir
AOJ Aomori
APL Nampula
APW Apia
AQI Qaisumah
AQJ Aqaba
AQP Arequipa
ARN Stockholm
ASB Ashgabat
ASF Astrakhan
ASR Kayseri
ASU Asunción
ASW Aswan
ATH Athens
ATL Atlanta
ATQ Amritsar
ATZ Asyut
AUA Aruba
AUH Abu Dhabi
AUS Austin
AVV Melbourne (Avalon, Australia)
AWA Hawassa
AWZ Ahvaz
AYT Antalya
BAH Manama
BAQ Barranquilla
BAV Baotou
BAX Barnaul
BBI Bhubaneswar
BBK Kasane
BBU București (Băneasa)
BCD Bacolod
BCM Bacău
BCN Barcelona (España)
BCU Bauchi
BDA Bermuda
BDJ Banjarmasin
BDL Hartford
BDQ Vadodara
BDS Brindisi
BEG Beograd
BEL Belém
BEM Béni Mellal
BEN Benghazi
BER Berlin
BES Brest (Francia)
BEW Beira
BEY Beirut
BFN Bloemfontein
BFS Belfast
BGF Bangui
BGI Barbados
BGO Bergen
BGW Baghdad
BGY Bergamo
BHK Bukhara
BHM Birmingham (Estados Unidos)
BHO Bhopal
BHX Birmingham (Reino Unido)
BIA Bastia
BIO Bilbao
BJA Béjaïa
BJL Banjul
BJM Bujumbura
BJV Bodrum
BJX León (México)
BKI Kota Kinabalu
BKK Bangkok (Suvarnabhumi)
BKO Bamako
BLA Barcelona (Venezuela)
BLJ Batna
BLL Billund
BLQ Bologna
BLR Bengaluru
BLZ Blantyre
BME Broome
BNA Nashville
BND Bandar Abbas
BNE Brisbane
BNX Banja Luka
BOD Bordeaux
BOG Bogotá
BOI Boise
BOJ Burgas
BOM Mumbai
BON Bonaire
BOO Bodø
BOS Boston
BOY Bobo Dioulasso
BPN Balikpapan
BPS Porto Seguro
BQT Brest (Bielorrusia)
BRC Bariloche
BRE Bremen
BRI Bari
BRM Barquisimeto
BRS Bristol
BRU Bruxelles
BSA Bosaso
BSB Brasília
BSG Bata
BSK Biskra
BSL Basel
BSR Basra
BSZ Bishkek
BTH Batam
BTJ Banda Aceh
BTS Bratislava
BUD Budapest
BUF Buffalo
BUQ Bulawayo
BUR Burbank
BUS Batumi
BVA Beauvais
BVB Boa Vista (Brasil)
BVC Boa Vista (Cabo Verde)
BWA Bhairahawa
BWI Baltimore
BWN Bandar Seri Begawan
BXY Baikonur
BZE Belize City
BZV Brazzaville
CAG Cagliari
CAI Cairo
CAN Guangzhou
CAP Cap-Haïtien
CAY Cayenne
CBB Cochabamba
CCJ Kozhikode
CCK West Island
CCP Concepción
CCS Caracas
CCU Kolkata
CDG Paris (Charles de Gaulle)
CEB Cebu
CEI Chiang Rai
CEK Chelyabinsk
CFE Clermont-Ferrand
CFK Chlef
CFU Corfu
CGB Cuiabá
CGH São Paulo (Congonhas)
CGK Jakarta (Soekarno-Hatta)
CGN Köln
CGO Zhengzhou
CGP Chattogram
CGQ Changchun
CGY Cagayan de Oro
CHC Christchurch
CHQ Chania
CHS Charleston (Carolina del Sur)
CIA Roma (Ciampino, Italia)
CIT Shymkent
CIX Chiclayo
CJB Coimbatore
CJJ Cheongju
CJS Ciudad Juárez
CJU Jeju
CKG Chongqing
CKY Conakry
CLE Cleveland
CLJ Cluj-Napoca
CLO Cali
CLT Charlotte
CMB Colombo (Bandaranaike)
CMH Columbus (Ohio)
CMN Casablanca
CMW Camagüey
CND Constanța
CNF Belo Horizonte
CNN Kannur
CNS Cairns
CNX Chiang Mai
COK Kochi (India)
COO Cotonou
COR Córdoba (Argentina)
COS Colorado Springs
COV Adana
CPH København
CPT Cape Town
CRA Craiova
CRD Comodoro Rivadavia
CRK Clark
CRL Charleroi
CRZ Türkmenabat
CSX Changsha
CTA Catania
CTG Cartagena
CTS Sapporo
CTU Chengdu (Shuangliu)
CUL Culiacán
CUN Cancún
CUR Curaçao
CUU Chihuahua
CUZ Cusco
CVG Cincinnati
CWB Curitiba
CWL Cardiff
CXI Kiritimati
CXR Nha Trang
CZL Constantine
CZM Cozumel
DAC Dhaka
DAD Da Nang
DAL Dallas (Love Field)
DAM Damascus
DAR Dar es Salaam
DAT Datong
DBB El Alamein
DBV Dubrovnik
DCA Washington (Reagan)
DEB Debrecen
DEL New Delhi
DEN Denver
DFW Dallas (DFW)
DIA Doha (International)
DIL Dili
DIR Dire Dawa
DJE Djerba
DJG Djanet
DJJ Jayapura
DJT West Palm Beach
DLA Douala
DLC Dalian
DLM Dalaman
DMB Taraz
DME Moscow (Domodedovo)
DMK Bangkok (Don Mueang)
DMM Dammam
DNH Dunhuang
DOH Doha (Hamad)
DPS Bali
DQM Duqm
DRP Legazpi
DRS Dresden
DRW Darwin
DSM Des Moines
DSN Ordos
DSS Dakar
DSY Dara Sakor
DTM Dortmund
DTW Detroit
DUB Dublin
DUR Durban
DUS Düsseldorf
DVO Davao
DWC Dubai (Al Maktoum)
DXB Dubai (International)
DXN Noida
DYG Zhangjiajie
DYU Dushanbe
DZA Dzaoudzi
DZN Zhezkazgan
EBB Entebbe
EBL Erbil
ECN Nicosia
EDI Edinburgh
EDL Eldoret
EDO Edremit
EHU Ezhou
EIN Eindhoven
EIS Tortola
ELP El Paso
ELQ Qassim
ELS East London
EMA East Midlands
ENO Encarnación
ENU Enugu
ERF Erfurt
ESB Ankara
ESM Esmeraldas
ETM Eilat
EUN El Aaiún
EVE Harstad-Narvik
EVN Yerevan
EWR New York (Newark)
EZE Buenos Aires (Ezeiza)
FAE Vágar
FAO Faro
FAT Fresno
FBM Lubumbashi
FCO Roma (Fiumicino, Italia)
FDF Fort-de-France
FDH Friedrichshafen
FEZ Fès
FIH Kinshasa
FJR Fujairah
FKB Karlsruhe
FKI Kisangani
FLL Fort Lauderdale
FLN Florianópolis
FLR Firenze
FMM Memmingen
FMO Münster
FNA Freetown
FNC Madeira
FNJ Pyongyang
FOC Fuzhou
FOR Fortaleza
FPO Freeport
FRA Frankfurt
FRW Francistown
FSC Figari
FSZ Shizuoka
FUE Fuerteventura
FUK Fukuoka
GAN Gan
GAU Guwahati
GBE Gaborone
GCM Grand Cayman
GDL Guadalajara
GDN Gdańsk
GEG Spokane
GEO Georgetown
GES General Santos
GHV Brașov
GIB Gibraltar
GIG Rio de Janeiro (Galeão)
GJL Jijel
GLA Glasgow (Reino Unido)
GMP Seoul (Gimpo)
GND Grenada
GNJ Ganja
GNY Şanlıurfa
GOA Genova
GOH Nuuk
GOI Goa (Dabolim)
GOJ Nizhny Novgorod
GOM Goma
GOT Göteborg
GOU Garoua
GOX Goa (Mopa)
GRJ George
GRO Girona
GRQ Groningen
GRR Grand Rapids
GRU São Paulo (Guarulhos)
GRV Grozny
GRZ Graz
GSM Qeshm
GSO Greensboro
GSV Saratov
GUA Ciudad de Guatemala
GUM Guam
GUW Atyrau
GVA Genève
GWD Gwadar
GXF Seiyun
GYD Baku
GYE Guayaquil
GYN Goiânia
GZT Gaziantep
HAH Moroni
HAJ Hannover
HAK Haikou
HAM Hamburg
HAN Hanoi
HAQ Hanimaadhoo
HAS Hail
HAV La Habana
HBA Hobart
HBE Alexandria (Egipto)
HDY Hat Yai
HEA Herat
HEL Helsinki
HER Heraklion
HET Hohhot
HFE Hefei
HGA Hargeisa
HGH Hangzhou
HHN Hahn
HIA Huai'an
HIJ Hiroshima
HIR Honiara
HKD Hakodate
HKG Hong Kong
HKT Phuket
HLA Johannesburg (Lanseria)
HLD Hailar
HLP Jakarta (Halim)
HMB Sohag
HMO Hermosillo
HND Tokyo (Haneda)
HNL Honolulu
HOF Hofuf
HOG Holguín
HOU Houston (Hobby)
HPH Haiphong
HRB Harbin
HRE Harare
HRG Hurghada
HSA Turkistan
HSG Saga
HSN Zhoushan
HSR Rajkot
HSS Hisar
HTA Chita
HUI Hue
HUN Hualien
HUX Huatulco
HWR Halwara
HYD Hyderabad (India)
IAD Washington (Dulles)
IAH Houston (Intercontinental)
IAR Yaroslavl
IAS Iași
IBR Ibaraki
IBZ Ibiza
ICN Seoul (Incheon)
IDR Indore
IFN Isfahan
IGU Foz do Iguaçu
IKA Tehran (Imam Khomeini)
IKT Irkutsk
IKU Issyk-Kul
ILO Iloilo
ILR Ilorin
IMF Imphal
INC Yinchuan
IND Indianapolis
INI Niš
INN Innsbruck
IOM Isle of Man
IPC Isla de Pascua
IPH Ipoh
IQQ Iquique
IQT Iquitos
ISB Islamabad
ISK Nashik
IST İstanbul (IST)
ITM Osaka (Itami)
IVL Ivalo
IXB Bagdogra
IXC Chandigarh
IXE Mangaluru
IXZ Port Blair
JAF Jaffna
JAI Jaipur
JAX Jacksonville (Florida)
JCL České Budějovice
JED Jeddah
JFK New York (JFK)
JGN Jiayuguan
JHB Johor Bahru
JHG Jinghong
JIB Djibouti
JIJ Jijiga
JJN Quanzhou
JNB Johannesburg (O.R. Tambo)
JPA João Pessoa
JRO Kilimanjaro
JTR Santorini
JUB Juba
JUJ Jujuy
JUL Juliaca
KAD Kaduna
KAN Kano
KBL Kabul
KBV Krabi
KCH Kuching
KCZ Kochi (Japón)
KDH Kandahar
KDU Skardu
KEF Reykjavík
KEJ Kemerovo
KER Kerman
KGD Kaliningrad
KGF Karaganda
KGL Kigali
KGS Kos
KHG Kashgar
KHH Kaohsiung
KHI Karachi
KHN Nanchang
KIH Kish Island
KIJ Niigata
KIK Kirkuk
KIM Kimberley
KIN Kingston
KIS Kisumu
KIX Osaka (Kansai)
KJA Krasnoyarsk
KKJ Kitakyushu
KLO Kalibo
KLU Klagenfurt
KLV Karlovy Vary
KMG Kunming
KMI Miyazaki
KMJ Kumamoto
KMQ Komatsu
KMS Kumasi
KNO Medan
KOA Kona
KOJ Kagoshima
KOS Sihanoukville
KOV Kokshetau
KQT Bokhtar
KRK Kraków
KRN Kiruna
KRR Krasnodar
KRS Kristiansand
KRT Khartoum
KSA Kosrae
KSF Kassel
KSN Kostanay
KTI Phnom Penh
KTM Kathmandu
KTT Kittilä
KTW Katowice
KUF Samara
KUL Kuala Lumpur (International)
KUN Kaunas
KUO Kuopio
KUT Kutaisi
KVA Kavala
KWE Guiyang
KWI Kuwait City
KWL Guilin
KYA Konya
KZN Kazan
KZO Kyzylorda
LAD Luanda (Quatro de Fevereiro)
LAE Lae
LAO Laoag
LAQ Al Bayda
LAS Las Vegas
LAX Los Angeles
LBA Leeds
LBD Khujand
LBV Libreville
LCA Larnaca
LCJ Łódź
LED St. Petersburg (Rusia)
LEJ Leipzig
LFW Lomé
LGA New York (LaGuardia)
LGB Long Beach
LGK Langkawi
LGW London (Gatwick, Reino Unido)
LHE Lahore
LHR London (Heathrow, Reino Unido)
LHW Lanzhou
LIH Lihue
LIL Lille
LIM Lima
LIN Milano (Linate)
LIR Liberia
LIS Lisboa
LJG Lijiang
LJU Ljubljana
LKO Lucknow
LLA Luleå
LLW Lilongwe
LNZ Linz
LOP Lombok
LOS Lagos
LPA Gran Canaria
LPB La Paz (Bolivia)
LPI Linköping
LPL Liverpool
LPP Lappeenranta
LPQ Luang Prabang
LRM La Romana
LTN London (Luton, Reino Unido)
LTO Loreto
LUN Lusaka
LUX Luxembourg
LUZ Lublin
LVI Livingstone
LWN Gyumri
LXA Lhasa
LXR Luxor
LYA Luoyang
LYG Lianyungang
LYP Faisalabad
LYS Lyon
MAA Chennai
MAD Madrid
MAH Menorca
MAJ Majuro
MAN Manchester (Reino Unido)
MAO Manaus
MAR Maracaibo
MBA Mombasa
MBJ Montego Bay
MCI Kansas City
MCO Orlando (International)
MCT Muscat
MCX Makhachkala
MCY Sunshine Coast
MCZ Maceió
MDC Manado
MDE Medellín
MDL Mandalay
MDW Chicago (Midway)
MDZ Mendoza
MED Medina
MEL Melbourne (Tullamarine, Australia)
MEM Memphis
MEX Ciudad de México (Benito Juárez)
MFM Macau
MFU Mfuwe
MGA Managua
MGQ Mogadishu
MHD Mashhad
MIA Miami
MID Mérida
MIU Maiduguri
MJI Tripoli
MJN Mahajanga
MKE Milwaukee
MLA Malta
MLE Malé
MLM Morelia
MMK Murmansk
MMX Malmö
MNI Gerald's Park
MNL Manila
MPL Montpellier
MPM Maputo
MQF Magnitogorsk
MQP Mbombela
MRS Marseille
MRU Mauritius
MRV Mineralnye Vody
MSP Minneapolis
MSQ Minsk
MST Maastricht
MSU Maseru
MSY New Orleans
MTY Monterrey
MUB Maun
MUC München
MUH Marsa Matruh
MUX Multan
MVD Montevideo
MWX Muan
MWZ Mwanza
MXP Milano (Malpensa)
MYJ Matsuyama
MYR Myrtle Beach
MZG Penghu
MZR Mazar-i-Sharif
MZT Mazatlán
NAG Nagpur
NAJ Nakhchivan
NAN Nadi
NAP Napoli
NAS Nassau
NAT Natal
NAV Nevşehir
NBJ Luanda (Agostinho Neto)
NBO Nairobi
NCE Nice
NCL Newcastle upon Tyne
NCU Nukus
NDB Nouadhibou
NDG Qiqihar
NDJ N'Djamena
NDR Nador
NGB Ningbo
NGO Nagoya
NGS Nagasaki
NIM Niamey
NJC Nizhnevartovsk
NJF Najaf
NKC Nouakchott
NKG Nanjing
NLA Ndola
NLU Ciudad de México (Felipe Ángeles)
NMA Namangan
NMI Navi Mumbai
NNG Nanning
NOC Knock
NOS Nosy Be
NOU Nouméa
NQN Neuquén
NQZ Astana
NRN Weeze
NRT Tokyo (Narita)
NSI Yaoundé
NSK Norilsk
NTE Nantes
NTL Newcastle
NUE Nürnberg
NUM Neom
NVT Navegantes
NYO Nyköping
NYT Naypyitaw
OAK Oakland
OAX Oaxaca
OCS Corisco Island
ODE Odense
OEC Oecussi-Ambeno
OGG Maui
OHD Ohrid
OHS Suhar
OKA Okinawa
OKC Oklahoma City
OKJ Okayama
OLB Olbia
OMA Omaha
OMO Mostar
OMR Oradea
OMS Omsk
ONT Ontario
OOL Gold Coast
OPO Porto
ORD Chicago (O'Hare)
ORF Norfolk
ORK Cork
ORN Oran
ORU Oruro
ORY Paris (Orly)
OSL Oslo
OSR Ostrava
OSS Osh
OST Oostende
OTP București (Henri Coandă)
OUA Ouagadougou
OUD Oujda
OUL Oulu
OVB Novosibirsk
OVD Asturias
OXB Bissau
OZG Zagora
OZZ Ouarzazate
PAD Paderborn
PAP Port-au-Prince
PBC Puebla
PBH Paro
PBM Paramaribo
PCL Pucallpa
PDG Padang
PDL Ponta Delgada
PDV Plovdiv
PDX Portland (Oregón)
PED Pardubice
PEE Perm
PEG Perugia
PEK Beijing (Capital)
PEN Penang
PER Perth
PEV Pécs
PEW Peshawar
PFO Paphos
PHC Port Harcourt
PHE Port Hedland
PHH Pokhara
PHL Philadelphia
PHX Phoenix
PIE St. Petersburg (Estados Unidos)
PIK Prestwick
PIT Pittsburgh
PKC Petropavlovsk-Kamchatsky
PKX Beijing (Daxing)
PKZ Pakse
PLQ Palanga
PLS Providenciales
PLX Semey
PLZ Gqeberha
PMC Puerto Montt
PMI Palma de Mallorca
PMO Palermo
PMV Isla de Margarita
PNK Pontianak
PNQ Pune
PNR Pointe-Noire
PNS Pensacola
POA Porto Alegre
POG Port-Gentil
POM Port Moresby
POS Port of Spain
POZ Poznań
PPG Pago Pago
PPK Petropavl
PPS Puerto Princesa
PPT Papeete
PQC Phu Quoc
PRG Praha
PRN Prishtina
PSA Pisa
PSD Port Said
PSP Palm Springs
PSR Pescara
PTG Polokwane
PTP Pointe-à-Pitre
PTY Ciudad de Panamá
PUJ Punta Cana
PUQ Punta Arenas
PUS Busan
PUY Pula
PVD Providence
PVG Shanghai (Pudong)
PVH Porto Velho
PVR Puerto Vallarta
PWM Portland (Maine)
PWQ Pavlodar
PYK Karaj
PZO Puerto Ordaz
PZU Port Sudan
QRO Querétaro
RAI Praia
RAK Marrakech
RAR Rarotonga
RBA Rabat
RBR Rio Branco
RDU Raleigh-Durham
REC Recife
RES Resistencia
REU Reus
RGL Río Gallegos
RGN Yangon
RHO Rhodes
RIC Richmond (Virginia)
RIX Rīga
RIY Mukalla
RJK Rijeka
RKT Ras Al Khaimah
RKZ Shigatse
RMF Marsa Alam
RMI Rimini
RML Colombo (Ratmalana)
RMO Chișinău
RMQ Taichung
RMU Murcia
RNO Reno
ROB Monrovia
ROC Rochester (Nueva York)
ROP Rota
ROR Koror
ROS Rosario (Argentina)
RSI Red Sea
RSW Fort Myers
RTB Roatán
RTM Rotterdam
RUH Riyadh
RUN Saint-Denis
RVN Rovaniemi
RZE Rzeszów
SAG Shirdi
SAH Sanaa
SAI Siem Reap
SAL San Salvador (El Salvador)
SAN San Diego
SAP San Pedro Sula
SAT San Antonio
SAV Savannah
SAW İstanbul (Sabiha Gökçen)
SBD San Bernardino
SBZ Sibiu
SCL Santiago
SCO Aktau
SCQ Santiago de Compostela
SCR Sälen
SCU Santiago de Cuba
SCV Suceava
SDF Louisville
SDJ Sendai
SDQ Santo Domingo (República Dominicana)
SDU Rio de Janeiro (Santos Dumont)
SEA Seattle
SEZ Mahé
SFB Orlando (Sanford)
SFO San Francisco
SFS Subic Bay
SGC Surgut
SGN Ho Chi Minh City
SHA Shanghai (Hongqiao)
SHE Shenyang
SHJ Sharjah
SHO Manzini
SID Sal
SIN Singapore
SJC San José (Estados Unidos)
SJD Los Cabos
SJJ Sarajevo
SJO San José (Costa Rica)
SJU San Juan (Puerto Rico)
SJW Shijiazhuang
SKB Saint Kitts
SKD Samarkand
SKG Thessaloniki
SKO Sokoto
SKP Skopje
SKT Sialkot
SKX Saransk
SLA Salta
SLC Salt Lake City
SLL Salalah
SLZ São Luís
SMF Sacramento
SNA Santa Ana
SNC Salinas
SNN Shannon
SNU Santa Clara
SOC Surakarta
SOF Sofia
SPU Split
SPX Giza
SRE Sucre
SRG Semarang
SRQ Sarasota
SSA Salvador
SSG Malabo
SSH Sharm El Sheikh
STI Santiago de los Caballeros
STL St. Louis
STN London (Stansted, Reino Unido)
STR Stuttgart
STT St. Thomas
STV Surat
SUB Surabaya
SUF Lamezia Terme
SUV Suva
SVD Kingstown
SVG Stavanger
SVO Moscow (Sheremetyevo)
SVQ Sevilla
SVX Yekaterinburg
SWA Jieyang
SXB Strasbourg
SXM Sint Maarten
SXR Srinagar
SYD Sydney (Australia)
SYR Syracuse
SYX Sanya
SYZ Shiraz
SZB Kuala Lumpur (Subang)
SZG Salzburg
SZX Shenzhen
SZZ Szczecin
TAB Tobago
TAE Daegu
TAG Bohol
TAK Takamatsu
TAO Qingdao
TAS Tashkent
TAZ Daşoguz
TBS Tbilisi
TBU Nuku'alofa
TBZ Tabriz
TET Tete
TFN Tenerife (Norte)
TFS Tenerife (Sur)
TFU Chengdu (Tianfu)
TGD Podgorica
THR Tehran (Mehrabad)
TIA Tirana
TIF Taif
TIJ Tijuana
TIR Tirupati
TJM Tyumen
TJU Kulob
TKK Chuuk
TKS Tokushima
TKU Turku
TLC Toluca
TLL Tallinn
TLM Tlemcen
TLS Toulouse
TLV Tel Aviv
TML Tamale
TMM Toamasina
TMP Tampere
TMR Tamanrasset
TMS São Tomé
TNA Jinan
TNG Tanger
TNN Tainan
TNR Antananarivo
TOF Tomsk
TOM Tombouctou
TOS Tromsø
TPA Tampa
TPE Taipei (Taoyuan)
TQO Tulum
TRD Trondheim
TRF Sandefjord
TRN Torino
TRS Trieste
TRU Trujillo
TRV Thiruvananthapuram
TRW South Tarawa
TRZ Tiruchirappalli
TSA Taipei (Songshan)
TSF Treviso
TSN Tianjin
TSR Timișoara
TTU Tétouan
TUC Tucumán
TUK Turbat
TUL Tulsa
TUN Tunis
TUS Tucson
TUU Tabuk
TXN Huangshan
TYN Taiyuan
TYS Knoxville
TZL Tuzla
UBN Ulaanbaatar
UET Quetta
UFA Ufa
UGC Urgench
UIO Quito
UKB Kobe
UKK Ust-Kamenogorsk
ULH Al-Ula
UME Umeå
UPG Makassar
URA Uralsk
URC Ürümqi
USM Koh Samui
UTH Udon Thani
UTP Pattaya
UUD Ulan Ude
UUS Yuzhno-Sakhalinsk
UVF Saint Lucia
UYU Uyuni
VAA Vaasa
VAR Varna
VAV Vava'u
VBY Visby
VCA Can Tho
VCE Venezia
VCP Campinas
VER Veracruz
VFA Victoria Falls
VGA Vijayawada
VIE Wien
VIL Dakhla
VIX Vitória (Brasil)
VKO Moscow (Vnukovo)
VLC Valencia (España)
VLI Port Vila
VLN Valencia (Venezuela)
VNO Vilnius
VNS Varanasi
VOG Volgograd
VRA Varadero
VRN Verona
VSA Villahermosa
VST Västerås
VTE Vientiane
VTZ Visakhapatnam
VVI Santa Cruz de la Sierra
VVO Vladivostok
VXE São Vicente
WAW Warszawa (Chopin)
WDH Windhoek
WLG Wellington
WLS Wallis
WMI Warszawa (Modlin)
WNZ Wenzhou
WRO Wrocław
WTB Toowoomba
WUH Wuhan
WUX Wuxi
WVB Walvis Bay
XBJ Birjand
XIY Xi'an
XMN Xiamen
XNN Xining
XPL Tegucigalpa
YAP Yap
YCU Yuncheng
YEG Edmonton
YHM Hamilton (Canadá)
YHZ Halifax
YIA Yogyakarta
YIW Yiwu
YKS Yakutsk
YLW Kelowna
YNB Yanbu
YNT Yantai
YNY Yangyang
YNZ Yancheng
YOW Ottawa
YQB Québec
YQG Windsor
YUL Montréal
YVR Vancouver
YWG Winnipeg
YXE Saskatoon
YYC Calgary
YYJ Victoria (Canadá)
YYT St. John's
YYZ Toronto
ZAD Zadar
ZAG Zagreb
ZAH Zahedan
ZAM Zamboanga
ZAZ Zaragoza
ZCO Temuco
ZHA Zhanjiang
ZIA Moscow (Zhukovsky)
ZIH Ixtapa-Zihuatanejo
ZNZ Zanzibar
ZQN Queenstown
ZRH Zürich
ZSA San Salvador (Bahamas)
ZSE Saint-Pierre (Reunión)
ZUH Zhuhai
ZYL Sylhet
AAA Anaa
AAP Samarinda
AAT Altay
AAX Araxá
AAY Al Ghaydah
ABE Allentown
ABI Abilene
ABK Kebri Dahar
ABL Ambler
ABR Aberdeen (Dakota del Sur)
ABS Abu Simbel
ABT Al-Baha
ABX Albury
ABY Albany (Georgia)
ACH St. Gallen
ACI Alderney
ACK Nantucket
ACT Waco
ACV Arcata
ACX Xingyi
ACY Atlantic City
ADF Adıyaman
ADK Adak
ADQ Kodiak
ADU Ardabil
AEB Baise
AEU Abu Musa
AEX Alexandria (Luisiana)
AFA San Rafael
AFL Alta Floresta
AFZ Sabzevar
AGH Ängelholm
AGR Agra
AGS Augusta (Georgia)
AGX Agatti
AHA Ambikapur
AHE Ahe Atoll
AHO Alghero
AHU Al Hoceima
AIA Alliance
AIN Wainwright
AJA Ajaccio
AJI Ağrı
AJL Aizawl
AJN Ouani
AJR Arvidsjaur
AJU Aracaju
AKF Kufra
AKJ Asahikawa
AKN King Salmon
AKP Anaktuvuk Pass
AKR Akure
AKU Aksu
AKY Sittwe
ALF Alta
ALH Albany (Australia)
ALO Waterloo
ALS Alamosa
ALW Walla Walla
AMA Amarillo
AMH Arba Minch
AMV Amderma
ANI Aniak
ANR Antwerpen
ANV Anvik
ANX Andenes
AOG Anshan
AOI Ancona
AOK Karpathos
AOO Altoona
AOR Alor Setar
APN Alpena
APO Apartadó
AQA Araraquara
AQG Anqing
ARC Arctic Village
ARH Arkhangelsk
ARI Arica
ARK Arusha
ARM Armidale
ART Watertown (Nueva York)
ARU Araçatuba
ARW Arad
ASD Andros Town
ASE Aspen
ASI Cat Hill
ASJ Amami
ASM Asmara
ASO Asosa
ASP Alice Springs
ASV Amboseli
ATC Arthur's Town
ATK Atqasuk
ATM Altamira
ATW Appleton
ATY Watertown (Dakota del Sur)
AUC Arauca
AUG Augusta (Maine)
AUQ Hiva Oa
AUR Aurillac
AUX Araguaína
AVA Anshun
AVK Arvaikheer
AVL Asheville
AVN Avignon
AVP Wilkes-Barre
AVR Amravati
AWK Wake Island
AXA Anguilla
AXD Alexandroupolis
AXF Bayanhot
AXJ Amakusa
AXM Armenia
AXP Spring Point
AXR Arutua
AXT Akita
AXU Axum
AYJ Ayodhya
AYP Ayacucho
AYQ Uluru
AZA Mesa
AZD Yazd
AZN Andijan
AZO Kalamazoo
AZR Adrar
AZS Samaná
BAL Batman
BAR Qionghai
BAY Baia Mare
BBA Balmaceda
BBM Battambang
BBN Bario
BBO Berbera
BBQ Codrington
BCA Baracoa
BCH Baucau
BCI Barcaldine
BCO Jinka
BDB Bundaberg
BDH Bandar Lengeh
BDO Bandung
BDT Gbadolite
BDU Bardufoss
BEB Benbecula
BED Bedford
BEF Bluefields
BEJ Tanjung Redeb
BEK Bareilly
BET Bethel
BEU Bedourie
BFD Bradford
BFF Scottsbluff
BFI Seattle (Boeing Field)
BFJ Bijie
BFL Bakersfield
BFV Buriram
BFY Bengbu
BGA Bucaramanga
BGC Bragança
BGG Bingöl
BGM Binghamton
BGR Bangor
BHB Bar Harbor
BHD Belfast (City)
BHE Blenheim
BHH Bisha
BHI Bahía Blanca
BHJ Bhuj
BHQ Broken Hill
BHS Bathurst (Australia)
BHU Bhavnagar
BHV Bahawalpur
BHY Beihai
BIH Bishop
BIK Biak
BIL Billings
BIM South Bimini
BIQ Biarritz
BIR Biratnagar
BIS Bismarck
BJB Bojnord
BJC Denver (Rocky Mountain Metropolitan)
BJF Båtsfjord
BJR Bahir Dar
BJZ Badajoz
BKG Branson
BKN Balkanabat
BKQ Blackall
BKS Bengkulu
BKW Beckley
BLD Boulder City
BLE Borlänge
BLI Bellingham
BLV Belleville
BMA Stockholm (Bromma)
BMI Bloomington
BMU Bima
BMV Buon Ma Thuot
BMW Bordj Badji Mokhtar
BNI Benin City
BNK Ballina
BNN Brønnøysund
BNS Barinas
BOB Bora Bora
BOC Bocas del Toro
BOH Bournemouth
BOR Ton Phueng
BPE Qinhuangdao
BPL Bole
BPT Beaumont
BPX Qamdo
BPY Besalampy
BQK Brunswick
BQL Boulia
BQN Aguadilla
BQS Blagoveshchensk
BQU Bequia
BRD Brainerd
BRK Bourke
BRL Burlington (Iowa)
BRN Bern
BRO Brownsville
BRQ Brno
BRR Barra
BRW Utqiaġvik
BRX Barahona
BSC Bahía Solano
BSD Baoshan
BSO Basco
BTC Batticaloa
BTI Barter Island
BTK Bratsk
BTM Butte
BTR Baton Rouge
BTU Bintulu
BTV Burlington (Vermont)
BUA Buka Island
BUN Buenaventura
BUX Bunia
BUZ Bushehr
BVE Brive
BVG Berlevåg
BVH Vilhena
BVI Birdsville
BVJ Bovanenkovo
BWK Brač
BWO Balakovo
BWT Burnie
BXH Balkhash
BXR Bam
BXU Butuan
BYK Bouaké
BYM Bayamo
BYN Bayankhongor
BZG Bydgoszcz
BZI Balıkesir
BZL Barisal
BZN Bozeman
BZO Bolzano
BZR Béziers
BZX Bazhong
CAB Cabinda
CAC Cascavel
CAE Columbia (Carolina del Sur)
CAH Ca Mau
CAJ Canaima
CAK Akron
CAL Campbeltown
CAT Cascais
CAW Campos dos Goytacazes
CAZ Cobar
CBH Béchar
CBO Cotabato
CBQ Calabar
CBR Canberra
CBT Catumbela
CCC Cayo Coco
CCE New Cairo
CCF Carcassonne
CCR Concord (California)
CCZ Chub Cay
CDB Cold Bay
CDC Cedar City
CDE Chengde
CDP Kadapa
CDR Chadron
CDT Castellón de la Plana
CDV Cordova
CEC Crescent City
CED Ceduna
CEE Cherepovets
CEN Ciudad Obregón
CEZ Cortez
CFG Cienfuegos
CFN Donegal
CFR Caen
CFS Coffs Harbour
CGD Changde
CGI Cape Girardeau
CGM Mambajao
CGR Campo Grande
CHA Chattanooga
CHG Chaoyang
CHH Chachapoyas
CHM Chimbote
CHO Charlottesville
CHT Chatham Islands
CHX Changuinola
CID Cedar Rapids
CIF Chifeng
CIJ Cobija
CIU Sault Ste. Marie (Chippewa)
CIW Canouan
CIY Comiso
CJA Cajamarca
CJC Calama
CJL Chitral
CJM Chumphon
CKB Clarksburg
CKH Chokurdah
CKS Carajás
CKZ Çanakkale
CLD Carlsbad (California)
CLL College Station
CLQ Colima
CLY Calvi
CMA Cunnamulla
CME Ciudad del Carmen
CMF Chambéry
CMG Corumbá
CMI Champaign
CMU Kundiawa
CMX Houghton
CNB Coonamble
CNJ Cloncurry
CNM Carlsbad (Nuevo México)
CNP Neerlerit Inaat
CNQ Corrientes
CNY Moab
COD Cody
COQ Choibalsan
COU Columbia (Misuri)
CPC San Martín de los Andes
CPD Coober Pedy
CPE Campeche
CPO Copiapó
CPR Casper
CPV Campina Grande
CPX Culebra
CQW Wulong
CRI Colonel Hill
CRM Catarman
CRP Corpus Christi
CRV Crotone
CRW Charleston (Virginia Occidental)
CSG Columbus (Georgia)
CSK Cap Skirring
CSW Cabo San Lucas
CSY Cheboksary
CTC Catamarca
CTD Chitré
CTL Charleville
CTM Chetumal
CTN Cooktown
CUC Cúcuta
CUE Cuenca
CUF Cuneo
CUK Caye Caulker
CUM Cumaná
CUP Carúpano
CUQ Coen
CVM Ciudad Victoria
CVN Clovis
CVQ Carnarvon
CWA Wausau
CWJ Cangyuan
CXB Cox's Bazar
CXJ Caxias do Sul
CXP Cilacap
CYA Les Cayes
CYB Cayman Brac
CYC Caye Chapel
CYI Chiayi
CYO Cayo Largo del Sur
CYP Calbayog
CYS Cheyenne
CYX Cherskiy
CYZ Cauayan
CZE Coro
CZH Corozal (Belice)
CZS Cruzeiro do Sul
CZU Corozal (Colombia)
CZX Changzhou
DAB Daytona Beach
DAU Daru
DAV David
DAY Dayton
DBC Baicheng
DBO Dubbo
DBQ Dubuque
DBR Darbhanga
DCF Dominica (Canefield)
DCM Castres
DCY Daocheng
DDC Dodge City
DDG Dandong
DDR Tingri
DEA Dera Ghazi Khan
DEC Decatur (Illinois)
DED Dehradun
DEF Dezful
DGA Dangriga
DGO Durango (México)
DGT Dumaguete
DHM Dharamshala
DHN Dothan
DHX Kediri
DIB Dibrugarh
DIE Antsiranana
DIG Shangri-La
DIK Dickinson
DIN Dien Bien Phu
DIY Diyarbakır
DKA Katsina
DLE Dole
DLG Dillingham
DLH Duluth
DLI Da Lat
DLU Dali
DLZ Dalanzadgad
DMU Dimapur
DND Dundee
DNZ Denizli
DOD Dodoma
DOG Dongola
DOL Deauville
DOM Dominica (Douglas-Charles)
DOV Dover
DOY Dongying
DPL Dipolog
DPO Devonport
DRG Deering
DRO Durango (Estados Unidos)
DSI Destin
DSO Sŏndŏng-ni
DTU Wudalianchi
DUD Dunedin
DUE Chitato
DUJ Dubois
DUM Dumai
DUT Unalaska
DVL Devils Lake
DWD Dawadmi
DYR Anadyr
DZH Dazhou
EAM Najran
EAR Kearney
EAS San Sebastián
EAT Wenatchee
EAU Eau Claire
EBA Elba
EBD El-Obeid
EBJ Esbjerg
ECP Panama City Beach
EFL Kefalonia
EGC Bergerac
EGE Vail
EGS Egilsstaðir
EGX Egegik
EIE Yeniseysk
EJA Barrancabermeja
EJH Al Wajh
EKO Elko
ELC Elcho Island
ELD El Dorado
ELF El Fasher
ELG El Menia
ELH North Eleuthera
ELM Elmira
ELU El Oued
EMD Emerald
EMK Emmonak
ENA Kenai
ENF Enontekiö
ENH Enshi
ENY Yan'an
EOH Medellín (Olaya Herrera)
EOI Eday
EPR Esperance
EPU Pärnu
EQS Esquel
ERC Erzincan
ERH Errachidia
ERI Erie
ERL Erenhot
ERS Windhoek (Eros)
ERZ Erzurum
ESC Escanaba
ESD Eastsound
ESL Elista
ESR El Salvador
ESU Essaouira
ETR Santa Rosa (Ecuador)
ETZ Metz-Nancy
EUG Eugene
EUX Sint Eustatius
EVV Evansville
EWB New Bedford
EWN New Bern
EXT Exeter
EYK Beloyarskiy
EYP Yopal
EYW Key West
EZS Elazığ
FAI Fairbanks
FAR Fargo
FAV Fakarava
FAY Fayetteville (Carolina del Norte)
FCA Kalispell
FCN Cuxhaven
FDU Bandundu
FEG Fergana
FEN Fernando de Noronha
FGU Fangatau
FIZ Fitzroy Crossing
FKQ Fakfak
FKS Fukushima
FLA Florencia
FLG Flagstaff
FLO Florence
FLW Flores (Portugal)
FLZ Sibolga
FMA Formosa
FMI Kalemie
FNI Nîmes
FNT Flint
FOD Fort Dodge
FOG Foggia
FON La Fortuna
FRD Friday Harbor
FRL Forlì
FRO Florø
FRS Flores (Guatemala)
FSD Sioux Falls
FSM Fort Smith (Estados Unidos)
FSP Saint-Pierre (San Pedro y Miquelón)
FTE El Calafate
FTU Tôlanaro
FTW Fort Worth
FUG Fuyang
FUJ Goto
FUN Funafuti
FUO Foshan
FWA Fort Wayne
FYJ Fuyuan
FYN Fuyun
FYU Fort Yukon
GAJ Yamagata
GAL Galena
GAM Gambell
GAQ Gao
GAY Gaya
GBB Gabala
GBJ Grand-Bourg
GCC Gillette
GCH Gachsaran
GCI Guernsey
GCK Garden City
GCN Grand Canyon
GDB Gondia
GDE Gode
GDQ Gondar
GDT Grand Turk
GDV Glendive
GDX Magadan
GDZ Gelendzhik
GEA Nouméa (Magenta)
GEL Santo Ângelo
GEM Mengomeyén
GER Nueva Gerona
GET Geraldton
GEV Gällivare
GFF Griffith
GFK Grand Forks
GGG Longview
GGT George Town
GGW Glasgow (Montana)
GHA Ghardaïa
GHB Governor's Harbour
GID Gitega
GIL Gilgit
GIS Gisborne
GIZ Jizan
GJA Guanaja
GJT Grand Junction
GKA Goroka
GKN Gulkana
GLF Golfito
GLH Greenville (Misisipi)
GLT Gladstone
GMA Gemena
GMB Gambela
GME Gomel
GMO Gombe
GMQ Golog
GMR Totegegie
GNB Grenoble
GNS Gunungsitoli
GNV Gainesville
GOP Gorakhpur
GOQ Golmud
GOV Nhulunbuy
GPA Patras
GPI Guapi
GPS Galápagos
GPT Gulfport
GRB Green Bay
GRI Grand Island
GRK Killeen
GRW Graciosa
GRX Granada
GRY Grímsey
GSP Greenville (Carolina del Sur)
GST Gustavus
GTE Groote Eylandt
GTF Great Falls
GTR Columbus (Misisipi)
GUC Gunnison
GUP Gallup
GUR Alotau
GVR Governador Valadares
GWL Gwalior
GWT Sylt
GXG Negage
GXH Gannan
GYA Guayaramerín
GYM Guaymas
GYS Guangyuan
GYU Guyuan
GYY Gary
GZP Alanya
HAC Hachijojima
HAD Halmstad
HAU Haugesund
HBX Hubballi
HCJ Hechi
HCR Holy Cross
HCZ Chenzhou
HDF Heringsdorf
HDG Handan
HDM Hamadan
HDN Steamboat Springs
HDS Hoedspruit
HEH Heho
HEK Heihe
HFA Haifa
HFN Höfn
HFT Hammerfest
HGI Itanagar
HGN Mae Hong Son
HGO Korhogo
HGR Hagerstown
HGU Mount Hagen
HHH Hilton Head Island
HHQ Hua Hin
HHR Hawthorne
HIB Hibbing
HID Horn Island
HII Lake Havasu City
HIN Sacheon
HJJ Huaihua
HJR Khajuraho
HKK Hokitika
HKN Kimbe
HLE Jamestown (Santa Elena)
HLN Helena
HLZ Hamilton (Nueva Zelanda)
HMA Khanty-Mansiysk
HME Hassi Messaoud
HMI Hami
HNA Hanamaki
HNM Maui (Hana)
HNS Haines
HOB Hobbs
HOI Otepa
HOM Homer
HOR Horta
HOT Hot Springs
HOV Ørsta
HPA Lifuka
HPG Shennongjia
HPN White Plains
HQL Tashikuergan
HRI Mattala
HRL Harlingen
HRO Harrison
HSC Shaoguan
HSL Huslia
HSV Huntsville
HTG Khatanga
HTI Hamilton Island
HTN Hotan
HTS Huntington
HTT Mengnai
HTY Antakya
HUH Huahine
HUO Holingol
HUU Huánuco
HUY Humberside
HUZ Huizhou
HVB Hervey Bay
HVD Khovd
HVG Honningsvåg
HVN New Haven
HVR Havre
HXD Delingha
HYA Hyannis
HYN Taizhou
HYS Hays
HZA Heze
HZG Hanzhong
HZH Liping
IAA Igarka
IAG Niagara Falls
IAM In Aménas
IAN Kiana
IBA Ibadan
IBE Ibagué
ICT Wichita
IDA Idaho Falls
IEG Zielona Góra
IFJ Ísafjörður
IGA Matthew Town
IGD Iğdır
IGR Puerto Iguazú
IGT Magas
IJK Izhevsk
IKG Karakol
IKI Iki
IKS Tiksi
ILD Lleida
ILG Wilmington (Delaware)
ILI Iliamna
ILM Wilmington (Carolina del Norte)
ILP Île des Pins
ILQ Ilo
ILS San Salvador (Ilopango, El Salvador)
ILY Islay
IMP Imperatriz
IMT Iron Mountain
INH Inhambane
INL International Falls
INU Yaren
INV Inverness
INZ In Salah
IOA Ioannina
IOS Ilhéus
IPI Ipiales
IPL Imperial
IPN Ipatinga
IPT Williamsport
IQM Qiemo
IQN Qingyang
IRG Lockhart River
IRJ La Rioja
IRK Kirksville
IRP Isiro
ISA Mount Isa
ISE Isparta
ISG Ishigaki
ISP Islip
ISU Sulaymaniyah
ITB Itaituba
ITH Ithaca
ITO Hilo
IUE Alofi
IVC Invercargill
IWA Ivanovo
IWJ Masuda
IWK Iwakuni
IXA Agartala
IXD Prayagraj
IXG Belgaum
IXI Lilabari
IXJ Jammu
IXK Keshod
IXL Leh
IXM Madurai
IXP Pathankot
IXR Ranchi
IXS Silchar
IXU Aurangabad
IXY Kandla
IZA Juiz de Fora (Presidente Itamar Franco)
IZO Izumo
IZT Ixtepec
JAC Jackson (Wyoming)
JAE Jaén
JAN Jackson (Misisipi)
JAU Jauja
JAV Ilulissat
JBQ Santo Domingo (La Isabela, República Dominicana)
JBR Jonesboro
JDF Juiz de Fora (Francisco de Assis)
JDH Jodhpur
JDZ Jingdezhen
JEE Jérémie
JEG Aasiaat
JER Jersey
JGA Jamnagar
JGD Jiagedaqi
JGS Ji'an
JHM Maui (Kapalua)
JHS Sisimiut
JIC Jinchang
JIM Jimma
JIQ Qianjiang
JJD Jericoacoara
JJU Qaqortoq
JKG Jönköping
JKH Chios
JKR Janakpur
JLN Joplin
JLR Jabalpur
JMJ Lancang
JMK Mykonos
JMS Jamestown (Dakota del Norte)
JMU Jiamusi
JNG Jining
JNH Jiaxing
JNU Juneau
JNZ Jinzhou
JOE Joensuu
JOG Yogyakarta (Adisutjipto)
JOI Joinville
JOL Jolo
JOS Jos
JRH Jorhat
JSA Jaisalmer
JSH Sitia
JSI Skiathos
JSJ Jiansanjiang
JSR Jashore
JST Johnstown
JTC Bauru
JUZ Quzhou
JXA Jixi
JYV Jyväskylä
JZH Jiuzhaigou
KAB Kariba
KAC Qamishli
KAI Kaieteur Falls
KAJ Kajaani
KAO Kuusamo
KAT Kaitaia
KAW Kawthoung
KBR Kota Bharu
KCM Kahramanmaraş
KCT Galle
KCY Krasnoyarsk (Cheremshanka)
KDL Kärdla
KDM Huvadhu Atoll
KDO Kadhdhoo
KEM Kemi
KEP Nepalgunj
KET Kengtung
KFS Kastamonu
KGA Kananga
KGC Kingscote
KGI Kalgoorlie
KGP Kogalym
KGT Kangding
KHD Khoram Abad
KHK Khark
KHS Khasab
KHT Khost
KHV Khabarovsk
KHX Kihihi
KIR Kerry
KJB Kurnool
KJH Kaili
KJI Burqin
KJT Kertajati
KKC Khon Kaen
KKE Kerikeri
KKN Kirkenes
KKR Raitahiti
KKS Kashan
KKW Kikwit
KKX Kikai
KLH Kolhapur
KLR Kalmar
KLW Klawock
KLX Kalamata
KMA Kerema
KMC King Khaled Military City
KME Kamembe
KMW Kostroma
KND Kindu
KNG Kaimana
KNH Kinmen
KNQ Koné
KNS King Island
KNU Kanpur
KNX Kununurra
KOE Kupang
KOI Kirkwall
KOK Kokkola
KOP Nakhon Phanom
KPO Pohang
KPW Keperveem
KQH Ajmer
KRF Kramfors
KRL Korla
KRO Kurgan
KRP Karup
KRW Türkmenbaşy
KSC Košice
KSD Karlstad
KSH Kermanshah
KSL Kassala
KSU Kristiansund
KSY Kars
KSZ Kotlas
KTA Karratha
KTD Kitadaito
KTG Ketapang
KTN Ketchikan
KTP Kingston (Tinson Pen)
KUA Kuantan
KUH Kushiro
KUM Yakushima
KUS Kulusuk
KUU Kullu
KUV Gunsan
KVG Kavieng
KVO Kraljevo
KVX Kirov
KWA Kwajalein
KWJ Gwangju
KWM Kowanyama
KWZ Kolwezi
KXB Kolaka
KXK Komsomolsk-on-Amur
KYD Orchid Island
KYP Kyaukpyu
KYS Kayes
KYZ Kyzyl
KZI Kozani
KZR Kütahya
LAF Lafayette (Indiana)
LAJ Lages
LAL Lakeland
LAN Lansing
LAP La Paz (México)
LAR Laramie
LAU Lamu
LAW Lawton
LBB Lubbock
LBC Lübeck
LBE Latrobe
LBF North Platte
LBL Liberal
LBS Labasa
LBU Labuan
LCE La Ceiba
LCG A Coruña
LCH Lake Charles
LCK Columbus (Rickenbacker, Ohio)
LCX Longyan
LCY London (City, Reino Unido)
LDB Londrina
LDE Tarbes
LDS Yichun (Heilongjiang)
LDU Lahad Datu
LDX Saint-Laurent-du-Maroni
LDY Derry
LEA Exmouth
LEB Lebanon
LEI Almería
LEN León (España)
LER Leinster
LET Leticia
LEU La Seu d'Urgell
LEX Lexington
LFM Lamerd
LFQ Linfen
LFT Lafayette (Luisiana)
LGG Liège
LGI Deadman's Cay
LHG Lightning Ridge
LHL Lachin
LHS Las Heras
LIF Lifou
LIG Limoges
LIO Limón
LIT Little Rock
LIW Loikaw
LKL Lakselv
LKN Leknes
LLF Yongzhou
LLV Lüliang
LMM Los Mochis
LMN Limbang
LMP Lampedusa
LNJ Lincang
LNK Lincoln
LNL Longnan
LNO Leonora
LNS Lancaster
LNY Lanai
LOE Loei
LOO Laghouat
LPF Liupanshui
LPT Lampang
LRD Laredo
LRE Longreach
LRH La Rochelle
LRR Lar
LRU Las Cruces
LSC La Serena
LSE La Crosse
LSG Leshan
LSH Lashio
LSI Shetland
LSP Punto Fijo
LSR Kutacane
LST Launceston
LSY Lismore
LTD Ghadames
LTI Altai
LTK Latakia
LTM Lethem
LTU Latur
LTX Latacunga
LUA Lukla
LUD Lüderitz
LUG Lugano
LUK Cincinnati (Lunken)
LUM Mangshi
LUQ San Luis
LUR Cape Lisburne
LUV Langgur
LWB Lewisburg
LWS Lewiston
LYC Lycksele
LYH Lynchburg
LYI Linyi
LYR Longyearbyen
LZG Langzhong
LZH Liuzhou
LZN Matsu (Nangan)
LZO Luzhou
LZY Nyingchi
MAB Marabá
MAF Midland
MAG Madang
MAK Malakal
MAM Matamoros
MAQ Mae Sot
MAS Manus Island
MAU Maupiti
MAZ Mayagüez
MBD Mahikeng
MBE Monbetsu
MBI Mbeya
MBS Saginaw
MBT Masbate
MBW Melbourne (Moorabbin, Australia)
MBX Maribor
MCE Merced
MCG McGrath
MCK McCook
MCN Macon
MCP Macapá
MCW Mason City
MDG Mudanjiang
MDI Makurdi
MDK Mbandaka
MDQ Mar del Plata
MDT Harrisburg
MDU Mendi
MEB Melbourne (Essendon, Australia)
MEC Manta
MEE Maré
MEG Malanje
MEH Mehamn
MEI Meridian
MEQ Kuala Pesisir
MFE McAllen
MFK Matsu (Beigan)
MFR Medford
MGB Mount Gambier
MGC Michigan City
MGF Maringá
MGH Margate
MGM Montgomery
MGW Morgantown
MGZ Myeik
MHG Mannheim
MHH Marsh Harbour
MHK Manhattan
MHQ Mariehamn
MHT Manchester (Nuevo Hampshire)
MHU Mount Hotham
MIG Mianyang
MII Marília
MIM Merimbula
MIR Monastir
MJF Mosjøen
MJK Denham
MJM Mbuji Mayi
MJT Mytilene
MJZ Mirny
MKG Muskegon
MKK Molokai
MKL Jackson (Tennessee)
MKM Mukah
MKP Makemo
MKQ Merauke
MKR Meekatharra
MKU Makokou
MKW Manokwari
MKY Mackay
MKZ Melaka
MLB Melbourne (Estados Unidos)
MLG Malang
MLI Moline
MLN Melilla
MLU Monroe
MLW Monrovia (Spriggs Payne)
MLX Malatya
MMB Memanbetsu
MMD Minamidaito
MME Teesside
MMG Mount Magnet
MMH Mammoth Lakes
MMJ Matsumoto
MMO Maio
MMY Miyakojima (Miyako)
MNC Nacala
MNG Maningrida
MNJ Mananjary
MNX Manicoré
MOB Mobile
MOC Montes Claros
MOG Mong Hsat
MOL Molde
MOQ Morondava
MOT Minot
MOV Moranbah
MOZ Moorea
MPA Katima Mulilo
MPH Caticlan
MPN Mount Pleasant
MPY Maripasoula
MQJ Khonuu
MQL Mildura
MQM Mardin
MQN Mo i Rana
MQS Mustique
MQT Marquette
MQX Mekele
MRE Masai Mara
MRI Anchorage (Merrill)
MRX Mahshahr
MRY Monterey
MRZ Moree
MSJ Misawa
MSL Muscle Shoals
MSN Madison
MSO Missoula
MSR Muş
MSS Massena
MSZ Moçâmedes
MTJ Montrose
MTR Montería
MTT Minatitlán
MUA Munda
MUE Waimea
MUN Maturín
MUR Marudi
MVB Franceville
MVF Mossoró
MVP Mitú
MVQ Mogilev
MVR Maroua
MVT Mataiva
MWA Marion
MWL Mineral Wells
MXL Mexicali
MXV Mörön
MXX Mora
MYA Moruya
MYD Malindi
MYE Miyakejima
MYG Abraham Bay Settlement
MYL McCall
MYP Mary
MYQ Mysore
MYT Myitkyina
MYU Mekoryuk
MYW Mtwara
MYY Miri
MZH Amasya
MZI Mopti
MZL Manizales
MZO Manzanillo (Cuba)
MZQ Mkuze
MZS Moradabad
MZV Mulu
MZW Mecheria
NAA Narrabri
NAH Tabukan Utara
NAL Nalchik
NAM Namniwel
NAQ Qaanaaq
NAW Narathiwat
NBC Nizhnekamsk
NBE Enfidha
NBS Baishan
NCA North Caicos
NCY Annecy
NDC Nanded
NDU Rundu
NEC Necochea
NER Neryungri
NEV Nevis
NGE N'Gaoundéré
NGQ Shiquanhe
NHV Nuku Hiva
NKM Nagoya (Komaki)
NKT Şırnak
NLD Nuevo Laredo
NLH Ninglang
NLI Nikolayevsk-on-Amur
NLK Norfolk Island
NLT Xinyuan
NMF Noonu Atoll
NNM Naryan Mar
NNT Nan
NOB Nosara
NOJ Noyabrsk
NOP Sinop (Turquía)
NOV Huambo
NOZ Novokuznetsk
NPE Napier
NPL New Plymouth
NPO Nanga Pinoh
NPT Newport
NQY Newquay
NRA Narrandera
NRK Norrköping
NRR Ceiba
NSH Nowshahr
NSN Nelson
NST Nakhon Si Thammarat
NTG Nantong
NTN Normanton
NTQ Wajima
NTX Natuna
NUI Nuiqsut
NUX Novy Urengoy
NVA Neiva
NVI Navoi
NWI Norwich
NYA Nyagan
NYI Sunyani
NYK Nanyuki
NYM Nadym
NZC Nazca
NZH Manzhouli
NZL Zhalantun
OAJ Jacksonville (Carolina del Norte)
OBO Obihiro
OCC Coca
OCE Ocean City
OCJ Ocho Rios
ODB Córdoba (España)
OER Örnsköldsvik
OGD Ogden
OGL Georgetown (Ogle)
OGN Yonaguni
OGS Ogdensburg
OGU Ordu
OGX Ouargla
OGZ Vladikavkaz
OHE Mohe
OHO Okhotsk
OIM Izu Oshima
OIR Okushiri Island
OIT Oita
OKD Sapporo (Okadama)
OKE Okinoerabu
OKI Okinoshima
OKL Oksibil
OKY Oakey
OLA Ørland
OLF Wolf Point
OLM Olympia
OLZ Olyokminsk
OMD Oranjemund
OME Nome
OMH Urmia
OMN Zomin
OND Ondangwa
ONJ Odate-Noshiro
ONQ Zonguldak
ONX Colón
OOM Cooma
OPF Miami (Opa Locka Executive)
OPU Balimo
ORB Örebro
ORH Worcester
ORT Northway
OSD Östersund
OSI Osijek
OSW Orsk
OTH North Bend
OTZ Kotzebue
OUZ Zouérate
OVS Sovetskiy
OWB Owensboro
OYE Oyem
OZC Ozamiz
PAB Bilaspur
PAC Ciudad de Panamá (Albrook)
PAE Everett
PAG Pagadian
PAH Paducah
PAT Patna
PAV Paulo Afonso
PAZ Poza Rica
PBD Porbandar
PBG Plattsburgh
PBO Paraburdoo
PBR Puerto Barrios
PBU Putao
PCP Príncipe
PCR Puerto Carreño
PDA Puerto Inírida
PDK Atlanta (DeKalb Peachtree)
PDO Pendopo
PDP Punta del Este
PDS Piedras Negras
PDT Pendleton
PEI Pereira
PEM Puerto Maldonado
PES Petrozavodsk
PET Pelotas
PEX Pechora
PEZ Penza
PFB Passo Fundo
PGA Page
PGD Punta Gorda (Estados Unidos)
PGF Perpignan
PGH Pantnagar
PGK Pangkal Pinang
PGU Asaluyeh
PGV Greenville (Carolina del Norte)
PGZ Ponta Grossa
PHB Parnaíba
PHF Newport News
PHG Port Harcourt (City)
PHS Phitsanulok
PHW Phalaborwa
PHY Phetchabun
PIA Peoria
PIB Hattiesburg
PIH Pocatello
PIR Pierre
PIS Poitiers
PIU Piura
PIX Pico
PIZ Point Lay
PJM Puerto Jiménez
PKB Parkersburg
PKE Parkes
PKR Pokhara (Domestic)
PKU Pekanbaru
PKV Pskov
PKY Palangkaraya
PLJ Placencia
PLM Palembang
PLN Pellston
PLO Port Lincoln
PLW Palu
PMF Parma
PMG Ponta Porã
PMQ Perito Moreno
PMR Palmerston North
PMW Palmas
PMY Puerto Madryn
PNA Pamplona
PNI Pohnpei
PNL Pantelleria
PNP Popondetta
PNT Puerto Natales
PNY Puducherry
PNZ Petrolina
POL Pemba
POP Puerto Plata
POR Pori
PPB Presidente Prudente
PPN Popayán
PPP Proserpine
PQI Presque Isle
PQQ Port Macquarie
PRA Paraná
PRC Prescott
PRI Praslin
PRM Portimão
PSC Pasco
PSE Ponce
PSG Petersburg
PSM Portsmouth
PSO Pasto
PSS Posadas
PSU Putussibau
PSZ Puerto Suárez
PTH Port Heiden
PTJ Portland (Australia)
PTU Platinum
PUB Pueblo
PUD Puerto Deseado
PUF Pau
PUG Port Augusta
PUU Puerto Asís
PUW Pullman
PUZ Puerto Cabezas
PVA Providencia
PVK Preveza
PVU Provo
PWE Pevek
PXM Puerto Escondido
PXO Porto Santo
PXR Surin
PXU Pleiku
PYJ Udachny
PZB Pietermaritzburg
PZH Zhob
PZI Panzhihua
QBC Bella Coola
QOW Owerri
QRW Warri
QSF Sétif
QSR Salerno
QSZ Shache
QUO Uyo
RAB Rabaul
RAE Arar
RAH Rafha
RAO Ribeirão Preto
RAP Rapid City
RAS Rasht
RBY Ruby
RCB Richards Bay
RCH Riohacha
RDD Redding
RDM Redmond
RDO Radom
RDP Durgapur
RDZ Rodez
REG Reggio Calabria
REL Trelew
REN Orenburg
RER Retalhuleu
REW Rewa
REX Reynosa
RFD Rockford
RFP Raiatea
RGA Río Grande
RGI Rangiroa
RGO Hoemun-ri
RHD Termas de Río Hondo
RHI Rhinelander
RIA Santa Maria (Brasil)
RIB Riberalta
RIS Rishiri
RIW Riverton
RIZ Rizhao
RJA Rajahmundry
RJH Rajshahi
RJL Logroño
RJN Rafsanjan
RKD Rockland
RKE Roskilde
RKS Rock Springs
RKV Reykjavík (Domestic)
RLG Rostock
RLK Bayannur
RMA Roma (Australia)
RMZ Tobolsk
RNB Ronneby
RNJ Yoron
RNN Rønne
RNS Rennes
ROA Roanoke
ROI Roi Et
ROK Rockhampton
ROO Rondonópolis
ROT Rotorua
ROW Roswell
RPR Raipur
RQA Ruoqiang Town
RRG Rodrigues
RRS Røros
RSA Santa Rosa (Argentina)
RSD Rock Sound
RST Rochester (Minnesota)
RSU Yeosu
RUA Arua
RUR Rurutu
RUT Rutland
RVK Rørvik
RVY Rivera
RXS Roxas
RYK Rahim Yar Khan
RZR Ramsar
RZV Rize
SAB Saba
SAF Santa Fe (Estados Unidos)
SAQ San Andros
SBA Santa Barbara
SBH Saint-Barthélemy
SBN South Bend
SBP San Luis Obispo
SBT Sabetta
SBW Sibu
SBY Salisbury
SCC Deadhorse
SCE State College
SCK Stockton
SCN Saarbrücken
SCT Socotra
SCW Syktyvkar
SDD Lubango
SDE Santiago del Estero
SDG Sanandaj
SDK Sandakan
SDL Sundsvall
SDP Sand Point
SDR Santander
SDS Sado
SDW Sindhudurg
SDY Sidney
SEB Sabha
SEK Srednekolymsk
SEN London (Southend, Reino Unido)
SFA Sfax
SFG Grand Case
SFJ Kangerlussuaq
SFN Santa Fe (Argentina)
SFT Skellefteå
SGD Sønderborg
SGF Springfield (Misuri)
SGU St George (Utah)
SHB Nakashibetsu
SHD Staunton
SHI Miyakojima (Shimojishima)
SHL Shillong
SHM Shirahama
SHR Sheridan
SHS Jingzhou
SHV Shreveport
SHW Sharurah
SIG San Juan (Isla Grande, Puerto Rico)
SIS Sishen
SIT Sitka
SJE San José del Guaviare
SJI San Jose (Occidental Mindoro)
SJK São José dos Campos
SJL São Gabriel da Cachoeira
SJP São José do Rio Preto
SJT San Angelo
SJZ São Jorge
SKN Stokmarknes
SKZ Sukkur
SLD Sliač
SLE Salem
SLK Saranac Lake
SLM Salamanca
SLN Salina
SLP San Luis Potosí
SLU Saint Lucia (George F. L. Charles)
SLW Saltillo
SLY Salekhard
SMA Santa Maria (Portugal)
SMI Samos
SML Stella Maris
SMN Salmon
SMR Santa Marta
SMS Sainte-Marie
SMW Smara
SMX Santa Maria (Estados Unidos)
SNB Milikapiti
SNE São Nicolau
SNO Sakon Nakhon
SNP St Paul Island
SNV Santa Elena de Uairén
SNW Thandwe
SOB Hévíz
SOJ Sørkjosen
SOM El Tigre
SON Luganville
SOQ Sorong
SOU Southampton
SOW Show Low
SPC La Palma
SPD Saidpur
SPI Springfield (Illinois)
SPN Saipan
SPP Menongue
SPR San Pedro (Belice)
SPS Wichita Falls
SPY San Pedro (Costa de Marfil)
SQD Shangrao
SQG Sintang
SQJ Sanming
SQL San Carlos
SRP Stord
SRT Soroti
SRY Sari
SRZ Santa Cruz de la Sierra (El Trompillo)
SSJ Sandnessjøen
SST Santa Teresita
SSY Mbanza Congo
STC Saint Cloud
STD Santo Domingo (Venezuela)
STG St George (Alaska)
STM Santarém
STS Santa Rosa (Estados Unidos)
STW Stavropol
STX St. Croix
SUG Surigao
SUI Sukhumi
SUJ Satu Mare
SUN Sun Valley
SUX Sioux City
SVA Savoonga
SVB Sambava
SVC Silver City
SVI San Vicente del Caguán
SVJ Svolvær
SVL Savonlinna
SVZ San Antonio del Táchira
SWF Newburgh
SWO Stillwater
SYO Shonai
SYQ San José (Tobías Bolaños, Costa Rica)
SYS Saskylakh
SYY Stornoway
SZA Soyo
SZF Samsun
SZH Shuozhou
SZK Skukuza
SZY Olsztyn
TAC Tacloban
TAH Tanna Island
TAI Taiz
TAM Tampico
TAP Tapachula
TAT Poprad
TAY Tartu
TBB Tuy Hoa
TBH Tablas Island
TBI Cat Island
TBJ Tabarka
TBN Fort Leonard Wood
TBP Tumbes
TBT Tabatinga
TCA Tennant Creek
TCB Treasure Cay
TCO Tumaco
TCP Taba
TCQ Tacna
TCZ Tengchong
TDD Trinidad (Bolivia)
TDK Taldykorgan
TDX Trat
TEB Teterboro
TEE Tébessa
TEN Tongren
TEQ Çorlu
TER Terceira
TEX Telluride
TEZ Tezpur
TFF Tefé
TGG Kuala Terengganu
TGJ Tiga
TGM Târgu Mureș
TGO Tongliao
TGR Touggourt
TGT Tanga
TGU Tegucigalpa (Toncontín)
TGZ Tuxtla Gutiérrez
THE Teresina
THG Biloela
THL Tachileik
THN Trollhättan
THQ Tianshui
THS Sukhothai
TIH Tikehau
TIM Timika
TIN Tindouf
TIQ Tinian
TIU Timaru
TIV Tivat
TIW Tacoma
TJA Tarija
TJG Tanta-Tabalong
TJH Toyooka
TJK Tokat
TKD Sekondi-Takoradi
TKF Truckee
TKG Bandar Lampung
TKN Tokunoshima
TKP Takapoto
TKX Takaroa
TLE Toliara
TLH Tallahassee
TLN Toulon
TLQ Turpan
TME Tame
TMH Tanah Merah
TMJ Termez
TMT Oriximiná
TMW Tamworth
TMX Timimoun
TND Trinidad (Cuba)
TNE Tanegashima
TNH Tonghua
TNJ Tanjung Pinang
TOD Tioman
TOE Tozeur
TOL Toledo (Ohio)
TOU Touho
TOY Toyama
TPJ Taplejung
TPP Tarapoto
TPQ Tepic
TPS Trapani
TRA Tarama
TRC Torreón
TRE Tiree
TRG Tauranga
TRI Tri-Cities
TRK Tarakan
TRR Trincomalee
TRT Toraja
TSJ Tsushima
TSM Taos
TST Trang
TSV Townsville
TTA Tan Tan
TTE Ternate
TTJ Tottori
TTN Trenton
TTT Taitung
TUA Tulcán
TUB Tubuai
TUF Tours
TUG Tuguegarao
TUI Turaif
TUO Taupo
TUP Tupelo
TUR Tucuruí
TVC Traverse City
TVF Thief River Falls
TVT Tashkent (Khumo)
TVY Dawei
TWF Twin Falls
TWT Bongao
TWU Tawau
TXE Takengon
TXK Texarkana
TYF Torsby
TYL Talara
TYR Tyler
TZA Belize City (Sir Barry Bowen)
TZN Congo Town
TZX Trabzon
UAI Suai
UAQ San Juan (Argentina)
UAR Bouarfa
UBA Uberaba
UBJ Ube
UBP Ubon Ratchathani
UCB Ulanqab
UCT Ukhta
UDI Uberlândia
UDR Udaipur
UEL Quelimane
UEO Kumejima
UGA Bulgan
UGU Bilogai
UIB Quibdó
UIH Quy Nhon
UIN Quincy
UKE Bhawanipatna
UKX Ust-Kut
ULG Ölgii
ULK Lensk
ULO Ulaangom
ULP Quilpie
ULU Gulu
ULV Ulyanovsk (Baratayevka)
ULY Ulyanovsk (Vostochny)
UNI Union Island
UNK Unalakleet
UNN Ranong
UPN Uruapan
URE Kuressaare
URG Uruguaiana
URJ Uray
URT Surat Thani
URY Gurayat
USA Concord (Carolina del Norte)
USH Ushuaia
USK Usinsk
USN Ulsan
USR Ust-Nera
UST St Augustine
USU Coron
UTN Upington
UTO Utopia Creek
UTT Mthatha
UUA Bugulma
UVE Ouvéa
UYL Nyala
UYN Yulin (Shaanxi)
VAI Vanimo
VAM Maamigili
VAN Van
VAQ Vanavara
VAS Sivas
VAW Vardø
VBS Brescia
VCS Con Dao
VCT Victoria (Estados Unidos)
VDC Vitória da Conquista
VDE El Hierro
VDH Dong Hoi
VDM Viedma
VDO Van Don
VDS Vadsø
VDZ Valdez
VEL Vernal
VEO Severo-Yeniseysk
VGO Vigo
VHM Vilhelmina
VIG El Vigía
VII Vinh
VIJ Virgin Gorda
VIT Vitoria (España)
VKG Rach Gia
VKT Vorkuta
VLD Valdosta
VLL Valladolid
VLV Valera
VMU Baimuru
VNX Vilanculo
VOL Volos
VOZ Voronezh
VPE Ngiva
VPN Vopnafjörður
VPS Fort Walton Beach
VPY Chimoio
VQS Vieques
VRB Vero Beach
VRC Virac
VRL Vila Real
VSE Viseu
VTU Las Tunas
VUP Valledupar
VUS Velikiy Ustyug
VVC Villavicencio
VVZ Illizi
VXC Lichinga
VXO Växjö
VYI Vilyuisk
WAE Wadi Al Dawasir
WAG Wanganui
WBM Wapenamanda
WDS Shiyan
WEF Weifang
WEH Weihai
WEI Weipa
WGA Wagga Wagga
WGE Walgett
WGN Shaoyang
WHA Wuhu
WHK Whakatāne
WIC Wick
WIL Nairobi (Wilson)
WIN Winton
WJR Wajir
WJU Wonju
WKA Wanaka
WKJ Wakkanai
WKK Aleknagik
WMN Maroantsetra
WMT Zunyi (Maotai)
WMX Wamena
WNI Wakatobi
WNP Naga
WNR Windorah
WNS Nawabshah
WOS Wonsan
WRE Whangarei
WRG Wrangell
WST Westerly
WSZ Westport
WUA Wuhai
WUN Wiluna
WUS Wuyishan
WUU Wau
WUZ Wuzhou
WWK Wewak
WYA Whyalla
WYS West Yellowstone
XAI Xinyang
XAP Chapecó
XCH Flying Fish Cove
XCR Châlons-en-Champagne
XFN Xiangyang
XIC Xichang
XIL Xilinhot
XKS Kasabonika
XMH Manihi
XMS Macas
XNA Fayetteville (Arkansas)
XQP Quepos
XQU Qualicum Beach
XRY Jerez de la Frontera
XSC South Caicos
XSP Singapore (Seletar)
XTG Thargomindah
XUZ Xuzhou
XWA Williston
YAA Anahim Lake
YAG Fort Frances
YAK Yakutat
YAM Sault Ste. Marie (Ste)
YAY St. Anthony
YAZ Tofino
YBC Baie-Comeau
YBG Saguenay
YBK Baker Lake
YBL Campbell River
YBP Yibin
YBR Brandon
YBX Blanc-Sablon
YBY Bonnyville
YCB Cambridge Bay
YCD Nanaimo
YCG Castlegar
YCM St. Catharines
YDA Dawson City
YDF Deer Lake (Terranova y Labrador)
YDN Dauphin
YEI Bursa
YEV Inuvik
YFB Iqaluit
YFC Fredericton
YFS Fort Simpson
YGJ Yonago
YGL La Grande Rivière
YGP Gaspé
YGR Îles-de-la-Madeleine
YGV Havre-Saint-Pierre
YGW Kuujjuarapik
YHU Montréal (Saint-Hubert)
YHY Hay River
YIC Yichun (Jiangxi)
YIE Arxan
YIF St-Augustin
YIH Yichang
YIN Yining
YIV Island Lake
YKA Kamloops
YKF Kitchener-Waterloo
YKH Yingkou
YKL Schefferville
YKM Yakima
YKO Hakkari
YLK Barrie
YLL Lloydminster
YLX Yulin (Guangxi)
YMM Fort McMurray
YMO Moosonee
YMS Yurimaguas
YMT Chibougamau
YMX Montréal (Mirabel)
YNA Natashquan
YND Gatineau
YNJ Yanji
YNL Points North Landing
YOJ High Level
YOL Yola
YPA Prince Albert
YPE Peace River
YPL Pickle Lake
YPN Port-Menier
YPQ Peterborough
YPR Prince Rupert
YPW Powell River
YPX Puvirnituq
YPY Fort Chipewyan
YPZ Burns Lake
YQA Muskoka
YQD The Pas
YQH Watson Lake
YQK Kenora
YQL Lethbridge
YQM Moncton
YQN Nakina
YQQ Comox
YQR Regina
YQT Thunder Bay
YQU Grande Prairie
YQX Gander
YQY Sydney (Canadá)
YQZ Quesnel
YRB Resolute Bay
YRJ Roberval
YRL Red Lake
YRO Ottawa (Rockcliffe)
YRT Rankin Inlet
YSB Sudbury
YSF Stony Rapids
YSJ Saint John
YSM Fort Smith (Canadá)
YSQ Songyuan
YTH Thompson
YTS Timmins
YTY Yangzhou
YTZ Toronto (Billy Bishop)
YUM Yuma
YUS Yushu
YUX Sanirajak
YUY Rouyn-Noranda
YVB Bonaventure
YVC La Ronge
YVO Val-d'Or
YVP Kuujjuaq
YVQ Norman Wells
YVV Wiarton
YWK Wabush
YWL Williams Lake
YXC Cranbrook
YXH Medicine Hat
YXJ Fort St. John
YXL Sioux Lookout
YXS Prince George
YXT Terrace
YXU London (Canadá)
YXX Abbotsford
YXY Whitehorse
YYA Yueyang
YYB North Bay
YYD Smithers
YYE Fort Nelson
YYF Penticton
YYG Charlottetown (Isla del Príncipe Eduardo)
YYL Lynn Lake
YYQ Churchill
YYR Goose Bay
YYY Mont-Joli
YZF Yellowknife
YZP Sandspit
YZS Coral Harbour
YZT Port Hardy
YZU Whitecourt
YZV Sept-Îles
YZY Zhangye
ZAL Valdivia
ZAT Zhaotong
ZBF Bathurst (Canadá)
ZBR Chabahar
ZCL Zacatecas
ZEL Bella Bella
ZHY Zhongwei
ZIG Ziguinchor
ZIX Zhigansk
ZKP Zyryanka
ZLO Manzanillo (México)
ZMT Masset
ZND Zinder
ZNE Newman
ZOS Osorno
ZQZ Zhangjiakou
ZSJ Sandy Lake
ZTH Zakynthos
ZYI Zunyi (Xinzhou)
AAK Buariki
AAZ Quezaltenango
ABM Bamaga
ABU Atambua
ACF Aral
AET Allakaket
AGE Wangerooge
AGI Wageningen
AGJ Aguni
AIP Adampur
AIT Aitutaki
AIU Atiu Island
AKA Ankang
AKB Atka
AKI Akiak
AKK Akhiok
AKS Auki
AKV Akulivik
ANS Andahuaylas
APK Apataki
ARD Kabola
ATT Atmautluak
AUK Alakanuk
AUL Aur Atoll
AUU Aurukun
BAS Ballalae
BAZ Barcelos
BBG Butaritari
BBR Basse-Terre
BDD Badu Island
BDP Bhadrapur
BFQ Puerto Piña
BGK Big Creek
BHR Bharatpur
BID Block Island
BKC Buckland
BKM Bakalalan
BKZ Bukoba
BLB Panamá City
BLW Beledweyne
BMK Borkum
BMO Banmaw
BMR Baltrum
BMY Waala
BNB Boende
BNY Anua
BOT Bosset
BQB Busselton
BQG Bogorodskoye
BQJ Batagay
BRA Barreiras
BSX Pathein
BTT Bettles
BTW Batu Licin
BUC Burketown
BUI Bokondini
BUT Jakar
BUU Muara Bungo
BVS Breves
BWX Rogojampi
BXG Bendigo
BXT Bontang-Borneo Island
BYO Bonito
BYR Læsø
BYW Blakely Island
CAF Carauari
CAU Caruaru
CCA Chimore
CCV Craig Cove
CEL Canela
CEM Central
CFB Cabo Frio (CFB)
CHU Chuathbaluk
CHY Choiseul Bay
CIH Changzhi
CIK Chalkyitsik
CJN Cijulang
CJZ Cajazeiras
CKD Crooked Creek
CKW Christmas Creek Mine
CKX Chicken
CLP Clarks Point
CLV Caldas Novas
CNC Coconut Island
CNI Dalian (Changhai Dachangshandao)
COL Coll Island
CRU Carriacou Island
CSA Colonsay
CSH Solovetsky Islands
CUA Comondú
CVU Corvo
CWS Center Island
CYF Chefornak
CYT Yakataga
CYU Cuyo
DAX Dazhou (Dachuan)
DBA Dalbandin
DBM Debre Markos
DEE Yuzhno-Kurilsk
DEM Dembidollo
DEX Dekai
DGH Deoghar
DIU Diu
DJB Jambi
DLR Dalnerechensk
DMD Doomadgee
DOP Dolpa
DPT Deputatskiy
DQA Daqing
DRJ Drietabbetje
DRV Baa Atoll
DSD Grande Anse
DSE Dessie
DTB Siborong-Borong
DTD Datadawai-Borneo Island
DTR Decatur (Washington)
DWB Soalala
DXJ Xiangxi
EAA Eagle
EAX Kwatta
EBH El Bayadh
EDR Pormpuraaw
EEK Eek
EJT Enejit Island
EKS Shakhtyorsk
ELI Elim (ELI)
EME Emden
ENE Ende
ENI El Nido
ENT Eniwetok Atoll
EUA Eua Island
EVG Sveg
FBD Fayzabad
FBE Francisco Beltrão
FDE Førde
FHZ Fakahina
FIE Fair Isle
FLS Whitemark
FMT Faresmaathodaa
FND Funadhoo
FOA Foula
FRE Fera Island
FSH Singkil
FTA Futuna Island (Vanuatu)
FTI Fitiuta Village
FUT Futuna Island (Wallis y Futuna)
GAX Gamba
GBI Kalaburagi
GBZ Claris
GGF Almeirim (GGF)
GGJ Guaíra
GGR Garowe
GGS Gobernador Gregores
GIC Boigu Island
GKK Huvadhu Atoll (Kooddoo)
GLK Galcaio
GLV Golovin
GMI Gasmata Island
GMZ Alajero
GNU Goodnews
GOY Tura
GTA Gatokae
GTO Gorontalo
GUB San Quintín (Guerrero Negro)
GUZ Guarapari
GYZ Cosmo Newbery
GZG Garzê
GZO Gizo
HAA Hasvik
HAL Halali
HBQ Haibei
HDD Hyderabad (Pakistán)
HDK Kulhudhuffushi
HDO Ghaziabad
HEI Oesterdeichstrich
HFS Råda
HGD Hughenden
HGL Helgoland
HHZ Hikueru
HIL Shilavo
HJB Hejing
HLH Ulanhot
HMS Muara Teweh
HMV Hemavan
HNH Hoonah
HNY Hengyang
HOK Lajamanu
HPB Hooper Bay
HQQ Anyang (Hongqiqu)
HRF Hoarafushi
HUE Akwi
HUG Huehuetenango
HUS Hughes
IAO Del Carmen
IBB Puerto Villamil
ICC Isla de Coche
ICI Cicia
IGG Igiugig
IIA Inis Meáin
IKO Nikolski
ILF Ilford
IMK Simikot
INB Independence
INO Inongo
INQ Inis Oírr
IOR Inis Mór
IRA Kirakira
IRC Circle
IRZ Santa Isabel do Rio Negro
ISC St. Mary's
ITU Kurilsk (Iturup)
IWD Ironwood
JBB Jember
JBK Qitai
JCK Julia Creek
JDO Juazeiro do Norte
JEJ Ailinglapalap Atoll (Jeh)
JFR Paamiut
JGB Jagdalpur
JIK Ikaria Island
JIO Tiakur
JIU Jiujiang
JJG Jaguaruna
JJM Meru-Kinna
JKL Kalymnos Island
JLG Jalgaon
JMO Jomsom
JNX Naxos
JPE Paragominas
JPR Ji-Paraná
JQA Uummannaq (Qaarsut)
JRG Jharsuguda
JSK Bandar-e-Jask
JSU Maniitsoq
JSY Syros Island
JTY Astypalaia Island
JUH Chizhou
JUI Juist
JUM Jumla
JUV Upernavik
KAA Kasama
KAL Kaltag
KAX Kalbarri
KBC Birch Creek
KBU Stagen
KCA Kuqa
KCG Chignik (KCG)
KCQ Chignik Lake
KDD Khuzdar
KDI Kendari
KDV Vunisea
KEB Nanwalek
KEW Keewaywin
KFG Kalkgurung
KFP False Pass
KGE Kagau Island
KGK Koliganek
KGX Grayling
KHM Kanti
KHZ Kauehi
KIE Kieta
KIF Kingfisher Lake
KIO Kili Island
KIT Kithira Island
KKA Koyuk
KKH Kongiganak
KKI Akiachak
KLG Kalskag
KLN Larsen Bay
KLP Seruyan
KMN Kamina
KMO Manokotak
KNK Kokhanok
KNW New Stuyahok
KOC Koumac
KOT Kotlik
KOW Ganzhou (Huangjin)
KOZ Ouzinkie
KPN Kipnuk
KPV Perryville
KQA Akutan
KQR Karara
KRB Karumba
KRC Sungai Penuh
KRE Kirundo
KRI Kikori
KRY Karamay
KSJ Kasos Island
KSM St Mary's
KSO Argos Orestiko
KSQ Karshi
KSR Benteng
KTS Brevig Mission
KUD Kudat
KUG Kubin Island
KUK Kasigluk
KVC King Cove
KVK Apatity
KVL Kivalina
KVM Markovo
KWB Karimunjawa
KWK Kwigillingok
KWN Quinhagak
KWT Kwethluk
KXF Koro Island
KXO Kisoro
KYK Karluk
KYU Koyukuk
KZS Kastelorizo Island
LAK Aklavik
LBJ Labuan Bajo
LBP Long Banga
LBR Lábrea
LBW Long Bawan
LCR La Chorrera
LDG Leshukonskoye
LDH Lord Howe Island
LEC Lençóis
LEL Lake Evella
LEQ Land's End
LEV Bureta
LGL Long Datih
LGZ Shannan
LIK Likiep Island
LKA Tiwatobi
LKB Lakeba Island
LKI Lubang
LKM Lolak
LLB Qiannan
LLK Lankaran
LLO Palopo
LMA Minchumina
LMC La Macarena
LMY Lake Murray
LNB Lamen Bay
LNE Lonorore
LNU Malinau
LNV Londolovit
LOD Longana
LOH La Toma
LPD La Pedrera
LPM Lamap
LPS Lopez
LPU Long Apung-Borneo Island
LPY Chaspuzac
LQM Puerto Leguízamo
LRS Leros Island
LRV Gran Roque Island
LSA Losuia
LSW Lhok Seumawe-Sumatra Island
LTT Saint-Tropez
LUP Kalaupapa
LVO Laverton (LVO)
LWK Lerwick
LWY Lawas
LXG Luang Namtha
LXS Limnos Island
MBL Manistee
MCV McArthur River Mine
MFA Kilindoni
MFG Muzaffarabad
MFJ Moala
MGT Milingimbi Island
MHC Dalcahue
MHM Manaoba
MHX Manihiki Island
MIJ Mili Island
MIS Misima Island
MJE Majkin
MJY Motygino
MLL Marshall
MLO Milos Island
MLY Manley Hot Springs
MNF Mana Island
MNT Minto
MNU Mawlamyine
MNY Stirling Island
MOF Waioti
MOH Morowali (Maleo)
MOI Mitiaro Island
MOJ Moengo
MOU Mountain Village
MPC Muko Muko
MQC Miquelon
MRA Misrata
MSA Muskrat Dam
MTF Mizan Teferi
MTP Montauk
MUK Mauke Island
MUZ Musoma
MVY Martha's Vineyard
MWQ Magway
MXH Moro
MXW Mandalgobi
MXZ Meizhou (Meixian Changgangji)
MYI Murray Island
MYK May Creek
NAO Nanchong
NAU Napuka Island
NBN San Antonio de Palé
NCN Chenega
NDY Sanday
NGI Ngau
NGK Nogliki
NIB Nikolai
NIU Naiu Atoll
NLF Darnley Island
NLG Nelson Lagoon
NME Nightmute
NNB Santa Ana Island
NNR Inverin
NNY Nanyang
NOD Norddeich
NQU Nuquí
NRD Norderney
NRL North Ronaldsay
NTT Niuatoputapu
NUL Nulato
NUP Nunapitchuk
NUS Norsup
NYU Nyaung U
NZG Nizhneangarsk
OAL Cacoal
OBN North Connel
OBU Kobuk
OBX Obo
ODN Long Seridan
ODO Bodaybo
ODY Oudomsay
OES San Antonio Oeste
OFU Ofu
OJU Tojo Una-Una
OKR Yorke Island
OLH Old Harbor
OLJ Olpoi
OLP Olympic Dam
ONG Mornington Island
OOK Toksook Bay
OPP Salinópolis
OPS Sinop (Brasil)
ORG Paramaribo (Zorg en Hoop)
ORI Port Lions
ORV Noorvik
ORZ Orange Walk
OSY Namsos
OTD Contadora Island
OTS Anacortes
OUI Ushant
PAS Paros
PBJ Paama Island
PCN Koromiko
PDB Pedro Bay
PDM Pedasí
PEU Puerto Lempira
PFQ Parsabad
PFR Ilebo
PGM Port Graham
PHO Point Hope
PIP Pilot Point (PIP)
PJA Pajala
PKA Napaskiak
PKG Pangkor Island
PKN Pangkalanbun
PKP Puka Puka
PMK Palm Island
PND Punta Gorda (Belice)
PPE Puerto Peñasco
PPW Papa Westray
PQS Pilot Station
PSY Stanley
PTA Port Alsworth
PTF Malolo Lailai Island
PTO Pato Branco
PUR Puerto Rico
PXH Mount Eba
PYT Paracatu
RAM Ramingining
RBB Borba
RBQ Rurrenabaque
RBV Ramata
RCE Roche Harbor
RCM Richmond (Queensland)
RDV Red Devil
RET Røst
RHT Badanjilin
RIH Río Hato
RJM Waisai
RKI Sipura Island
RMP Rampart
RMT Rimatara Island
RNI Corn Island
RNL Rennell Island
RNP Rongelap Island
RRR Raroia
RSH Russian Mission
RTA Rotuma
RTG Satar Tacik
RTI Ba'a - Rote Island
RUL Maavaarulu
RUS Marau
RVE Saravena
RVV Raivavae
RYO Rio Turbio
SBR Saibai Island
SCM Scammon Bay
SCY Puerto Baquerizo Moreno
SCZ Santa Cruz
SDN Sandane
SET Serra Talhada
SEU Seronera
SFC St-François
SFL São Filipe
SGO St George (Australia)
SGY Skagway
SHC Shire Inda Selassie
SHF Shihezi
SHG Shungnak
SHH Shishmaref
SHY Shinyanga
SIF Simara
SIH Silgadi Doti
SKH Surkhet
SKK Shaktoolik
SKU Skiros Island
SLH Sola
SLI Solwesi
SLQ Sleetmute
SLX Salt Cay
SMK St Michael
SMQ Sampit
SMT Sorriso
SNX Semnan
SOD Sorocaba
SOG Sogndal
SOV Seldovia
SOY Stronsay
SRA Santa Rosa (Brasil)
SRL Mulegé (Palo Verde)
SRV Stony River
SSR Pentecost Island
SSW Friday Harbor (Stuart Island Airpark)
SUK Batagay-Alyta
SUR Summer Beaver
SUY Suntar
SVS Stevens Village
SVU Savusavu
SWL San Vicente
SWQ Sumbawa Besar
SWX Shakawe
SXK Saumlaki-Yamdena Island
SXP Nunam Iqua
SYM Pu'er
SYU Sue Islet
SZE Semera
SZI Zaysan
TAL Tanana
TBG Tabubil
TBM Tumbang Samba-Borneo Island
TBO Tabora
TCD Tarapacá
TCG Tacheng
TCR Vagaikulam
TCT Takotna (TCT)
TDS Sasereme
TEK Tatitlek
TFI Tufi
TGH Tongoa Island
TGQ Tangará da Serra
THD Thanh Hóa
THO Þórshöfn
THX Turukhansk
TIE Tippi
TIZ Tari
TJL Três Lagoas
TJQ Tanjung Pandan
TJS Tanjung Selor-Borneo Island
TKJ Tok
TKM Taksimo
TKQ Kigoma
TKV Tatakoto
TLA Teller
TLI Toli Toli-Celebes Island
TLT Tuluksak
TLU Santiago de Tolú
TLY Plastun
TMC Radamata
TMF Thimarafushi
TMG Tomanggong
TMI Tumling Tar
TNC Tin City
TNK Tununak
TOG Togiak Village
TOW Toledo (Brasil)
TPI Tapini
TTS Tsaratanana
TVS Tangshan
TVU Matei
TWA Twin Hills
TWC Tumxuk
UAH Ua Huka
UAP Ua Pou
UBB Mabuiag Island
UII Utila Island
UIT Jabor Jaluit Atoll
UJE Ujae Atoll
UKG Ust-Kuyga
ULZ Uliastai
UMS Ust-Maya
UMU Umuarama
UNA Una
UNG Kiunga
UOL Buol
USJ Usharal
UTK Utirik Island
UVI União da Vitória
UZR Urzhar
VAK Chevak
VAL Valença
VAO Suavanao
VBV Vanua Balavu
VCL Tam Nghĩa
VEE Venetie
VHV Verkhnevilyuisk
VJB Xai-Xai
VLS Epi Island
VSV Shravasti
WAA Wales
WBB Stebbins
WBQ Beaver
WDN Eastsound (Waldron)
WGP Waingapu-Sumba Island
WLH Walaha
WLK Selawik
WMO White Mountain
WNA Napakiak
WNH Wenshan
WNN Wunnumin Lake
WRY Westray
WSK Wushan
WSN South Naknek
WTA Tambohorano
WTE Wotje
WTK Noatak
WTL Tuntutuliak
WTO Wotho Island
WUT Xinzhou
WWT Mertarvik
WXN Wanzhou
XBE Bearskin Lake
XGR Kangiqsualujjuaq
XKH Xieng Khouang
XLB Lac Brochet
XMY Yam Island
XPK Pukatawagan
XSI South Indian Lake
XTL Tadoule Lake
XYA Yandina
YAB Arctic Bay
YAC Cat Lake
YAL Alert Bay
YAS Yasawa Island
YAT Attawapiskat
YAX Angling Lake
YBB Kugaaruk
YBE Uranium City
YBI Black Tickle
YBT Brochet
YBV Berens River
YCK Colville Lake
YCO Kugluktuk
YCR Cross Lake
YCS Chesterfield Inlet
YCY Clyde River
YDL Dease Lake
YDP Nain
YDV Bloodvein River
YEK Arviat
YER Fort Severn
YFA Fort Albany
YFH Fort Hope
YFJ Wekweètì
YFO Flin Flon
YFX St. Lewis
YGH Fort Good Hope
YGO Gods Lake Narrows
YGT Igloolik
YGX Gillam
YGZ Grise Fiord
YHA Port Hope Simpson
YHG Charlottetown (Terranova y Labrador)
YHI Ulukhaktok
YHK Gjoa Haven
YHO Hopedale
YHP Poplar Hill
YHR Chevery
YIK Ivujivik
YIO Pond Inlet
YKG Kangirsuk
YKQ Waskaganish
YKU Chisasibi
YLC Kimmirut
YLE Whatì
YLH Lansdowne House
YMH Mary's Harbour
YMN Makkovik
YMP Port McNeill
YNC Wemindji
YNE Norway House
YNO North Spirit Lake
YNP Natuashish
YNS Nemiscau
YOC Old Crow
YOG Ogoki Post
YOH Oxford House
YON Yongphulla
YPC Paulatuk
YPH Inukjuak
YPJ Aupaluk
YPM Pikangikum
YPO Peawanuck
YQC Quaqtaq
YRA Gamètì
YRF Cartwright
YRG Rigolet
YRS Red Sucker Lake
YSG Lutselk'e
YSK Sanikiluaq
YSO Postville
YST St. Theresa Point
YSY Sachs Harbour
YTE Kinngait
YTL Big Trout Lake
YTQ Tasiujaq
YTW Hotan (Yutian Wanfang)
YUD Umiujaq
YUT Repulse Bay
YVM Qikiqtarjuaq
YVZ Deer Lake (Ontario)
YWB Kangiqsujuaq
YWJ Déline
YWM Williams Harbour
YWP Webequie
YXN Whale Cove
YXP Pangnirtung
YYH Taloyoak
YZG Salluit
YZZ Trail
ZDY Delma Island
ZEM Eastmain River
ZFD Fond-du-Lac
ZFL Zhaosu
ZFM Fort Mcpherson
ZFN Tulita
ZGI Gods River
ZGS Le Golfe-du-Saint-Laurent
ZKE Kashechewan
ZLT La Tabatière
ZPB Sachigo Lake
ZPC Pucón
ZRJ Round Lake
ZTB Tête-à-la-Baleine
ZTM Shamattawa
ZUM Churchill Falls
ZWL Wollaston Lake
AGN Angoon
ALZ Lazy Bay
AOS Amook Bay
BJT Bentota
BKF Katmai National Park
CGA Craig
CXH Vancouver (Harbour Water)
CYM Chatham
DHB Deer Harbor
DWO Sri Jayawardenepura Kotte
EDA Edna Bay
ELV Elfin Cove
EXI Excursion Inlet
FBS Friday Harbor (Seaplane Base)
FNR Funter Bay
HBT Hambantota
HIS Hayman Island
HYG Hydaburg
HYL Hollis
KAE Kake
KCC Coffman Cove
KDZ Kandy (Polgolla Reservoir Seaplane Base)
KEH Kenmore
KKB Kitoi Bay
KMY Moser Bay
KOY Olga Bay
KPB Point Baker
KPR Port Williams
KPY Port Bailey
KTB Thorne Bay
KWP West Point
KXA Kasaan
KZB Zachar Bay
LBH Sydney (Palm Beach Seaplane Base, Australia)
LKE Seattle (Kenmore Air Harbor Seaplane Base)
MTM Metlakatla (Seaplane Base)
NKI Tuxekan Island
NSB Bimini
NYS New York (Skyports Inc Seaplane Base)
PEC Pelican
PPV Port Protection
PTD Port Alexander
RSJ Rosario (Estados Unidos)
SPB Charlotte Amalie
SSB Christiansted
SYB Seal Bay
SYF Gabriola Island
TKE Tenakee Springs
TTW Tissamaharama
UGI San Juan (Estados Unidos)
WFB Ketchikan (Harbor Seaplane Base)
WHD Hyder
WPL Powell River (Lake Seaplane Base)
WSX West Sound
WWP Whale Pass
YAJ Saturna Island
YAQ Maple Bay
YAV Miners Bay
YBF Bamfield
YBQ Thetis Island
YBW Bedwell Harbour
YGG Salt Spring Island
YGN Broughton Island
YHH Campbell River (Seaplane Base)
YIG Stuart Island
YMF Galiano Island
YTG Sullivan Bay
YTP Tofino (Harbour Seaplane Base)
YWH Victoria (Harbour Seaplane Base, Canadá)
YWS Whistler
ZNA Nanaimo (Harbour Water)
AGM Tasiilaq
AOQ Aappilattoq (Avannaata)
CHE Tallinn (Linnahall Heliport)
DIO Diomede
GZM Gozo
HHP Central and Western
IKE Ikerasak
IOQ Isortoq
IOT Illorsuit
IUI Innarsuit
JCH Qasigiannguit
JCU Ceuta
JGO Qeqertarsuaq
JGR Kangilinnguit
JNN Nanortalik
JNS Narsaq
JRA New York (West 30th Street Heliport)
JUK Ukkusissat
JUU Nuugaatsiaq
KGQ Kangersuatsiaq
KUZ Kuummiut
LLU Alluitsup Paa
MCM Fontvieille
NIQ Niaqornat
OBY Ittoqqortoormiit
PQT Qeqertaq
PZE Penzance
QCU Akunnaaq
QFG Eqalugaarsuit
QFI Iginniarfik
QFN Narsarmijit
QFX Igaliku
QGQ Attu
QJE Kitsissuarsuit
QJH Qassimiut
QJI Ikamiut
QOQ Saarloq
QPW Kangaatsiaq
QRY Ikerassaarsuk
QUV Aappilattoq (Kujalleq)
QUW Ammassivik
SAE Saattut
SGG Sermiligaaq
SRK Siorapaluk
SVR Savissivik
TQA Tasiusaq
TQI Tiniteqilaaq
TQR Tremiti Islands
TSS New York (East 34th Street Heliport)
UAK Narsarsuaq
UMD Uummannaq (Heliport)
VRY Værøy
XEQ Tasiusak
XIQ Ilimanaq
ASK Yamoussoukro
AZI Abu Dhabi (Al Bateen Executive)
DHA Dhahran
DKR Dakar (Léopold Sédar Senghor)
DNA Okinawa (Kadena)
EES Berenice Troglodytica
ISL İstanbul (Atatürk)
KBP Boryspil
LBG Paris (Le Bourget)
LPX Liepāja
LRL Niamtougou
LTH Ho Chi Minh City (Long Thanh)
LWO Lviv
ODS Odesa
OSM Mosul
PIO Pisco
PNH Phnom Penh (International)
ROV Rostov-on-Don
SIP Simferopol
SRX Sirt
ULN Ulaanbaatar (Buyant-Ukhaa)
WSI Sydney (Western, Australia)
AAM Malamala
AAO Anaco
AAQ Krasnyi Kurgan
AAV Surallah
ABC Albacete
ACJ Anuradhapura
ACN Ciudad Acuña
ACS Achinsk
ACZ Zabol
ADI Arandis
ADP Ampara (ADP)
ADT Ada
ADW Camp Springs
ADX Leuchars
AEG Padang Sidempuan
AEH Abeche
AFW Fort Worth (Perot)
AFY Afyonkarahisar
AGB Augsburg
AGC Pittsburgh (Allegheny)
AGF Agen
AGV Acarigua
AGZ Aggeneys
AHJ Ngawa
AHN Athens (Georgia)
AJY Agadez
AKC Akron (Fulton)
AKD Akola
AKH Al Kharj
AKT Akrotiri
AKW Omidiyeh (Aghajari)
ALI Alice
ALJ Alexander Bay
ALM Alamogordo (White Sands)
ALN Alton
ALR Alexandra
AMZ Manurewa
ANB Anniston
AND Anderson (Carolina del Sur)
ANE Angers
ANG Angoulême
ANK Ankara (Etimesgut)
ANM Antsirabe (Antsiranana)
ANN Metlakatla (Annette Island)
AOC Nobitz
AOL Paso de los Libres
AOT Saint-Christophe
APA Denver (Centennial)
APF Naples
APG Aberdeen (Maryland)
API Apiay
APJ Burang Town
APZ Zapala
ARA New Iberia
ARE Arecibo
ARX Aracati
ARY Ararat
ASA Assab
AST Astoria
ATA Anta
ATF Ambato
ATG Kamra
ATR Atar
AUF Auxerre
AUW Wausau (Downtown)
AVB Aviano
AVI Ciro Redondo
AXK Ataq
AXN Alexandria (Minnesota)
AYO Ayolas
AYX Atalaya
BAB Beale Air Force Base
BAD Bossier City
BAF Westfield
BAG Baguio
BAI Punta Arenas (Costa Rica)
BAT Barretos
BBD Brady
BBS Camberley
BBT Berbérati
BCE Bryce Canyon
BCL Pococi (Barra del Colorado)
BCQ Brak
BCT Boca Raton
BCW Benguera Island
BDE Baudette
BDM Bandırma
BDR Bridgeport
BEP Bellary
BEQ Bury Saint Edmunds (RAF Honington)
BEX Wallingford
BFE Bielefeld
BFH Curitiba (Bacacheri)
BFK Aurora (Estados Unidos)
BFM Mobile (Downtown)
BFO Chiredzi
BFP Beaver Falls
BFU Bengbu (Renheji)
BFX Bafoussam
BGN Belaya Gora
BGX Bagé
BIF Fort Bliss
BIG Delta Junction Ft Greely
BIU Bildudalur
BIX Biloxi
BIY Bisho
BJI Bemidji
BJO Bermejo
BJY Zemun
BKA Baykit
BKB Bikaner
BKE Baker City
BKH Kekaha
BKL Cleveland (Burke Lakefront)
BKY Kamakombe
BLF Bluefield
BLH Blythe
BLK Blackpool
BLN Benalla
BLT Blackwater
BMG Bloomington (Estados Unidos)
BMM Bitam
BNO Burns
BOU Bourges
BPC Bamenda
BPG Barra do Garças
BPH Bislig
BPI Big Piney
BPM Hyderabad (Begumpet, India)
BQA Baler
BQH London (Biggin Hill, Reino Unido)
BRT Wurrumiyanga
BSJ Bairnsdale
BTL Battle Creek
BTZ Betong
BUG Benguela
BUJ Ouled Sidi Brahim
BUP Bhatinda Air Force Station
BVY Beverly
BWE Braunschweig
BWF Barrow-in-Furness
BWG Bowling Green (Kentucky)
BWH Butterworth
BWQ Brewarrina
BWU Sydney (Bankstown, Australia)
BXB Babo
BXE Bakel
BYC Yacuíba
BYH Blytheville (Arkansas)
BYI Burley
BYJ Beja
BYS Fort Irwin
BYU Bindlach
BZB Bazaruto Island (BZB)
BZC Cabo Frio (Umberto Modiano)
BZD Balranald
BZK Bryansk
BZU Buta
BZY Bălți
BZZ Carterton
CAQ Caucasia
CAR Caribou
CAX Carlisle
CBD IAF Camp
CBG Cambridge (Reino Unido)
CBJ Cabo Rojo
CBL Ciudad Bolivar
CBM Columbus (Air Force Base, Misisipi)
CBV Coban
CCH Chile Chico
CCL Chinchilla
CCM Criciúma
CCY Charles City
CDJ Conceição do Araguaia
CDS Childress
CDU Cobbitty
CEF Chicopee
CEG Broughton
CEQ Cannes
CER Cherbourg
CEW Crestview (Bob Sikes)
CGF Cleveland (Cuyahoga)
CGJ Chingola
CHR Châteauroux
CIO Concepción (Paraguay)
CIS Abariringa
CKC Cherkasy
CKL Moscow (Chkalovskiy)
CKT Sarakhs
CLM Port Angeles
CLN Carolina
CLU Columbus (Indiana)
CLZ Guarico
CMD Cootamundra
CMQ Clermont
CMR Colmar
CNG Cognac
CNL Sindal
CNR Chañaral
CNU Chanute
COC Concordia (Argentina)
COE Coeur d'Alene
COF Cocoa Beach
COJ Coonabarabran
CON Concord (Nuevo Hampshire)
CQD Shahrekord
CQF Calais
CQM Ciudad Real
CRC Cartago
CRE North Myrtle Beach
CRG Jacksonville (Executive at Craig, Florida)
CRQ Caravelas
CSB Caransebeş
CSF Creil
CSN Carson City
CSV Crossville
CTB Cut Bank
CTT Le Castellet
CUB Columbia (Jim Hamilton L.B. Owens, Carolina del Sur)
CUT Cutral-Co
CVC Cleve
CVE Coveñas
CVJ Temixco
CVO Corvallis
CVS Clovis (Cannon Air Force Base)
CWC Chernivtsi
CWT Cowra
CWW Corowa
CXA Caicara del Orinoco
CXO Houston (Conroe-North)
CYG Corryong
CYW Celaya
CZF Cape Romanzof
DAA Fort Belvoir
DAG Daggett
DAN Danville (Virginia)
DBD Dhanbad
DCI Decimomannu
DCN Derby (RAAF Base Curtin)
DCT Duncan Town
DEJ Tongren (Dejiang)
DET Detroit (Coleman A. Young)
DEZ Deir ez-Zor
DGE Mudgee
DHF Al Dhafra
DHH Barkol
DHR Den Helder
DHT Dalhart
DIJ Dijon
DIS Dolisie
DJO Daloa
DKS Dikson
DLF Del Rio (Laughlin Air Force Base)
DLS Dallesport
DMA Tucson (Davis Monthan Air Force Base)
DMN Deming
DNK Dnipro
DNL Augusta (Daniel, Georgia)
DNQ Deniliquin
DNR Dinard
DPA Chicago (Dupage)
DRA Mercury (Desert Rock)
DRB Derby (DRB)
DRI DeRidder
DRN Dirranbandi
DRT Del Rio (International)
DSK Dera Ismael Khan
DTE Daet
DUA Durant
DUG Douglas Bisbee
DWA Dwangwa
DXR Danbury
DYA Dysart
DYS Abilene (Dyess Air Force Base)
DZO Durazno
EBG El Bagre
EBM El Borma
EBU Andrézieux-Bouthéon
ECG Elizabeth City
ECH Echuca
EDF Anchorage (Elmendorf Air Force Base)
EDM La Roche-sur-Yon
EDW Edwards
EEA Correia Pinto
EED Needles
EEN Keene
EFD Houston (Ellington)
EGH El Jora
EGI Crestview (Duke)
EGO Belgorod
EHL El Bolsón
EHM Cape Newenham
EIB Hörselberg-Hainich
EIK Yeysk
EIL Fairbanks (Eielson Air Force Base)
EKA Eureka (California)
EKB Ekibastuz
EKN Elkins
EKT Eskilstuna
ELB El Banco
ELY Ely (Nevada)
EML Emmen
ENC Tomblaine
END Enid (Vance Air Force Base)
ENK Enniskillen
ENN Nenana
ENS Enschede
ENV Wendover
ENW Kenosha
EOR Bolivar
EOZ Elorza
EPA El Palomar
EPL Épinal
ERD Berdyansk
ESE Ensenada (El Ciprés)
ESF Alexandria (Esler Army, Luisiana)
ESG Mariscal Estigarribia
ESH Brighton
ESK Eskişehir (ESK)
EUQ San Jose (Antique)
EVW Evanston
EVX Fauville
EZV Berezovo
FAB Farnborough
FAF Newport News (Felker Army Air)
FAZ Fasa
FBG Fort Bragg (Simmons Army Air, Carolina del Norte)
FBK Fairbanks (Ladd Army)
FCB Ficksburg
FCS Fort Carson
FDY Findlay
FEC Feira de Santana
FFD Fairford
FFO Dayton (Wright-Patterson Air Force Base)
FHU Fort Huachuca
FKJ Fukui
FKL Franklin (Pensilvania)
FME Fort Meade
FMN Farmington (Nuevo México)
FMY Fort Myers (Page)
FNB Trollenhagen
FNL Loveland
FOE Topeka (FOE)
FOM Foumban
FOS Forrest
FPR Fort Pierce
FRB Forbes
FRG East Farmingdale
FRI Fort Riley
FRZ Fritzlar
FSI Fort Sill
FST Fort Stockton
FTK Fort Knox
FTX Owando
FTY Atlanta (Fulton Brown)
FWH Fort Worth (NAS JRB)
FXE Fort Lauderdale (Executive)
FYT Faya-Largeau
FYV Fayetteville (Drake, Arkansas)
GAE Gabès
GAF Gafsa
GAO Guantánamo
GBT Gorgan
GCJ Midrand
GDO Guasdualito
GEC Lefkoniko
GFL Glens Falls
GFN Grafton
GFR Bréville-sur-Mer
GFY Grootfontein
GHC Bullocks Harbour
GHN Deyang
GHT Ghat
GHU Gualeguaychu
GIR Girardot
GJM Guajará-Mirim
GKE Geilenkirchen
GLD Goodland
GLI Glen Innes
GLO Staverton
GLS Galveston
GLU Gelephu
GLZ Rijen
GMU Greenville (Downtown, Carolina del Sur)
GNA Hrodna
GON Groton
GOZ Gorna Oryahovitsa
GPL Pococi (Guapiles)
GPN Pirlangimpi
GPO General Pico
GRF Joint Base Lewis McChord
GRS Grosseto
GSB Goldsboro
GSE Göteborg (Säve)
GSJ Puerto San José
GTN Glentanner Station
GUH Gunnedah
GUI Guiria
GUJ Guaratinguetá
GUL Goulburn
GUQ Guanare
GUS Peru (Indiana)
GUY Guymon
GVN Sovetskaya Gavan
GVX Sandviken
GWE Gweru
GWO Greenwood (Misisipi)
GXQ Coyhaique
GYG Magan
GYI Gisenyi
GZW Qazvin
HAW Haverfordwest
HBG Hattiesburg (Bobby L Chain)
HBR Hobart (Estados Unidos)
HCN Hengchun
HCQ Halls Creek
HFD Hartford (Brainard)
HHE Hachinohe
HIF Ogden (Hill Air Force Base)
HIM Polonnaruwa Town
HIO Portland (Hillsboro, Oregón)
HKY Hickory
HLG Wheeling
HLT Hamilton (Australia)
HMJ Khmelnytskyi
HMN Alamogordo (Holloman Air Force Base)
HNG Hainan
HON Huron
HOP Fort Campbell
HOQ Hof
HQM Hoquiam
HRK Kharkiv
HRM Hassi R'Mel
HRS Harrismith
HSM Horsham
HST Homestead
HSZ Hsinchu City
HTU Hopetoun
HTV Huntsville (Estados Unidos)
HUA Redstone Arsnl Huntsville
HUF Terre Haute
HUL Houlton
HUT Hutchinson
HVA Analalava
HWN Gwayi River Farms
HWO Hollywood
HXX Hay
HYR Hayward (Wisconsin)
HZB Merville
HZK Húsavík
HZU Chengdu (Huaizhou)
IAB Wichita (McConnell Air Force Base)
IBL Bazaruto Island (Indigo Bay Lodge)
IBP Iberia
IEJ Ie
IEV Kyiv
IFO Ivano-Frankivsk
IFP Bullhead City
IGL Çiğli
IGM Kingman
IGS Manching
IHR Iranshahr
IIL Ilam
IKK Kankakee
ILN Wilmington (Ohio)
ILZ Dolný Hričov
IMQ Showt
INA Inta
INK Wink
INT Winston Salem
INW Winslow
IQA Hīt
IRD Ishurdi
IRI Nduli
ISM Orlando (Kissimmee Gateway)
ISO Kinston
ITA Itacoatiara
IVR Inverell
IWO Ogasawara (Ioto)
IXH Kailashahar
IXV Along
IXW Jamshedpur
IXX Bidar
JAA Jalalabad
JAD Perth (Jandakot)
JAG Jacobabad
JAK Jacmel
JAL Emiliano Zapata
JAM Bezmer
JCR Jacareacanga
JCT Junction
JDE Hangzhou (Jiande Qiandaohu General)
JDG Jeju Island
JFN Ashtabula
JHF São Roque
JHW Jamestown (Nueva York)
JJI Juanjuí
JOH Port St Johns
JOK Yoshkar-Ola
JRF Kapolei
JSO Sobral
JWA Jwaneng
JWN Zanjan
JWO Gimseang-ro
JXN Jackson (Míchigan)
JYR Jiroft
KAG Gangneung
KAU Kauhava
KBK Kushinagar
KBS Bo
KCO Kartepe
KDT Nakhon Pathom
KEL Kiel
KEN Kenema
KES Kelsey
KEV Jämsä
KFZ Kukës
KGG Kédougou
KGJ Karonga
KGY Kingaroy
KHE Kherson
KHJ Kauhajoki
KID Kristianstad
KIW Kitwe
KJK Wevelgem
KKM Lop Buri
KLC Kaolack
KLD Tver
KLF Kaluga
KLS Kelso
KLZ Kleinsee
KMH Kuruman
KMP Keetmanshoop
KMU Kismayo
KMX Khamis Mushait
KNA Viña del Mar (KNA)
KNF King's Lynn
KNR Jam
KOU Koulamoutou
KPC Port Clarence
KPS Kempsey
KRA Kerang
KSK Karlskoga
KTE Kerteh
KTL Kitale
KTQ Kitee
KTR Tindal
KTU Kota
KVB Skövde
KWG Kryvyi Rih
KWY Kiwayu
KXE Klerksdorp
KYE Tripoli (Líbano)
LAA Lamar
LAI Lannion
LAY Ladysmith
LAZ Bom Jesus da Lapa
LBI Albi
LBQ Lambarene
LBT Lumberton (Carolina del Norte)
LBX Lubang (Filipinas)
LBY La Baule-Escoublac
LCC Galatina
LDV Landivisiau
LEE Leesburg
LEH Le Havre
LEY Lelystad
LFI Hampton (Virginia)
LFK Lufkin
LFR La Fria
LGH Leigh Creek
LGR Cochrane (Chile)
LGS Malargue
LGU Logan
LHA Lahr
LHK Xiangyang (Guangzhou MR)
LHN Linhares
LIP Lins
LIQ Lisala
LJN Angleton
LKG Lokichogio
LKY Lake Manyara National Park
LKZ Brandon (Reino Unido)
LLC Lal-lo
LME Le Mans
LMO Lossiemouth
LMQ Marsa al Brega
LMR Lime Acres
LMT Klamath Falls
LND Lander
LNX Smolensk
LOK Lodwar
LOL Lovelock
LOU Louisville (Bowman)
LOV Monclova
LOZ London (Estados Unidos)
LPG La Plata
LPK Lipetsk
LRF Jacksonville (Arkansas)
LRT Lorient
LSF Fort Benning
LSL Los Chiles
LSV Las Vegas (Nellis Air Force Base)
LSX Lhok Sukon-Sumatra Island
LTA Tzaneen
LTQ Le Touquet-Paris-Plage
LTS Altus (Air Force Base)
LUF Glendale (Arizona)
LUH Ludhiana
LUO Luena
LUW Luwok
LVA Laval
LVM Livingston
LVP Lavan Airport
LVS Las Vegas (Estados Unidos)
LWM Lawrence (Massachusetts)
LWR Leeuwarden
LWT Lewistown
LYB Blossom Village
LYN Chassieu
LYU Ely (Minnesota)
LYX Romney Marsh
LZC Lázaro Cárdenas
MAX Ouro Sogui
MAY Mangrove Cay
MBG Mobridge
MBO Mamburao
MCB McComb
MCC Sacramento (McClellan)
MCF Tampa (MacDill Air Force Base)
MCJ La Mina-Maicao
MCS Monte Caseros
MCU Lépaud
MDH Murphysboro
MDY Sand Island
MEA Macaé
MEK Meknes
MEN Mende
MER Merced (Castle)
MES Medan (Soewondo Air Force Base)
MEU Almeirim (Monte Dourado)
MFD Mansfield
MFH Mesquite
MFQ Maradi
MGE Marietta
MGL Mönchengladbach
MGN Magangué
MHR Sacramento (Mather)
MHV Mojave
MHZ Bury Saint Edmunds (RAF Mildenhall)
MIB Minot (Air Force Base)
MIE Muncie
MIK Mikkeli
MIV Millville
MJC Man
MJD Moenjodaro
MJL Mouila
MKC Kansas City (Charles B. Wheeler Downtown)
MLC Mc Alester
MLS Miles City
MMT Eastover
MMU Morristown (Nueva Jersey)
MMZ Maymana
MNH Al Masna'ah
MNR Mongu
MNZ Manassas
MOA Moa
MOD Modesto
MOE Momeik
MON Mount Cook
MPV Barre
MPW Mariupol
MQH Minaçu
MQQ Moundou
MQU Mariquita
MQY Smyrna
MRB Martinsburg
MRD Mérida (Venezuela)
MRG Mareeba
MRO Masterton
MRQ Gasan
MRR Macará
MRW Rødby
MSH Masirah
MSW Massawa
MTC Mount Clemens
MTH Marathon (Estados Unidos)
MTN Baltimore (Martin State)
MTS Manzini (Matsapha)
MTZ Masada
MUD Mueda
MUI Fort Indiantown Gap
MUO Mountain Home (Idaho)
MUW Ghriss
MVA Mývatn
MVZ Masvingo
MWD Mianwali
MWE Merowe
MWH Moses Lake
MXF Montgomery (Maxwell Air Force Base)
MXI Mati
MXJ Minna
MXM Morombe
MXN Morlaix
MYC Maracay
MYV Marysville
MZB Mocímboa da Praia
MZU Muzaffarpur
NAK Chaloem Phra Kiat
NBG New Orleans (NAS JRB)
NBW Guantanamo Bay Naval Station
NBX Nabire
NCO North Kingstown
NCS Newcastle (Sudáfrica)
NDD Sumbe
NEL Lakehurst
NEU Sam Neua
NEW New Orleans (Lakefront)
NFG Nefteyugansk
NFL Fallon (Naval Air Station)
NGA Young
NGF Kaneohe
NGP Corpus Christi (Naval Air Station Truax)
NGU Norfolk (Naval Station)
NHD Dubai (Al Minhad)
NHK Patuxent River
NHT Northolt
NHZ Brunswick (Estados Unidos)
NIP Jacksonville (Naval Air Station, Florida)
NIT Niort
NJA Ayase
NJK El Centro
NKW Diego Garcia
NKX San Diego (Miramar Marine Corps Air Station)
NLC Lemoore
NLO N'dolo
NLV Mykolaiv
NMB Daman
NMC Normans Cay
NMS Namsang
NNA Kenitra
NOA Nowra Hill
NOG Nogales (NOG, International)
NOI Krymsk
NPA Pensacola (Naval Air Station Forrest Sherman)
NQA Millington
NQI Kingsville
NQT Nottingham
NQX Key West (Naval Air Station)
NRB Jacksonville (Naval Station Mayport, Florida)
NSE Milton
NTB Notodden
NTD Point Mugu
NTR Monterrey (Del Norte)
NTU Virginia Beach
NTY Pilanesberg
NUJ Amirabad
NUQ Mountain View
NUU Nakuru
NUW Oak Harbor (Whidbey Island Naval Air Station)
NVS Marzy
NWA Fomboni
NYG Quantico
NZY San Diego (North Island Naval Air Station-Halsey)
OAG Orange
OAI Bagram
OAM Oamaru
OBF Weßling
OBS Lanas
OCA Key Largo
OCN Oceanside
OCV Ocaña
ODH Hook
OFF Omaha (Offutt Air Force Base)
OFK Norfolk (Estados Unidos)
OGB Orangeburg
OHA RNZAF Base Ohakea
OKN Okondja
OKO Fussa
OLL Oyo
OLS Nogales (OLS, International)
OLU Columbus (Nebraska)
OMB Omboue
OMC Ormoc City
ONO Ontario (Estados Unidos)
ONP Newport (Oregón)
ORA Orán (Argentina)
ORL Orlando (Executive)
OSH Oshkosh (Wisconsin)
OSN Pyeongtaek
OSU Columbus (The Ohio State University, Ohio)
OTI Gotalalamo-Morotai Island
OTM Ottumwa
OTR Corredores
OUE Ouesso
OUH Oudtshoorn
OWD Norwood
OXF Kidlington
OXR Oxnard
OYA Goya
OYK Oiapoque
OYO Tres Arroyos
OYP Saint-Georges-de-l'Oyapock
OZH Zaporizhia
OZP Morón (España)
OZR Fort Rucker
PAL La Dorada
PAM Panama City (Estados Unidos)
PAN Pattani
PAO Palo Alto
PAQ Palmer (Estados Unidos)
PAX Port-de-Paix
PBF Pine Bluff
PBL Puerto Cabello
PBN Port Amboim
PBZ Plettenberg Bay
PCF Potchefstroom
PDU Paysandú
PEH Pehuajó
PGX Périgueux
PIL Pilar
PIW Pikwitonei
PJC Pedro Juan Caballero
PJG Panjgur
PKT Wadeye
PKW Selebi Phikwe
PLL Manaus (Ponta Pelada)
PLU Belo Horizonte (Pampulha)
PLV Poltava
PMA Chake Chake
PMD Palmdale
PMS Tadmur
PMZ Palmar Sur
PNB Porto Nacional
PNC Ponca City
PNE Philadelphia (Northeast)
PNV Panevėžys
PNX Denison (Texas)
POB Fort Bragg (Pope, Carolina del Norte)
POE Fort Polk
POI Potosí
POO Poços De Caldas
POT Ken Jones
POU Poughkeepsie
POW Sečovlje
POX Cormeilles-en-Vexin
PPI Port Pirie
PPQ Paraparaumu
PRB Paso Robles
PRH Phrae
PRV Přerov
PRX Paris (Texas)
PRY Pretoria (Wonderboom)
PSI Pasni
PSJ Poso-Celebes Island
PTK Pontiac
PTM Palmarito
PTX Pitalito
PUT Puttaparthi
PVO Portoviejo
PVS Chukotka
PWK Chicago (Executive)
PWT Bremerton
PWY Pinedale
PYH Puerto Ayacucho
PYR Andravida
PZA Paz de Ariporo
PZS Temuco (Maquehue)
PZY Piešťany
QCY Lincoln (RAF Coningsby, Reino Unido)
QGU Gifu
QHR Debre Zeyit
QMJ Masjed Soleyman
QNS Porto Alegre (Canoas Air Force Base)
QPG Paya Lebar
QRA Johannesburg (Rand)
QRM Narromine
RAJ Rajkot (RAJ)
RAL Riverside (RAL)
RAZ Rawalakot
RBE Ratanakiri
RBL Red Bluff
RCA Rapid City (Ellsworth Air Force Base)
RCO Rochefort
RCQ Reconquista
RCU Rio Cuarto
RDG Reading
RDL El Hassana
RDR Grand Forks (Air Force Base)
RDS Rincon de los Sauces
REA Reao
RGK Gorno-Altaysk
RGS Burgos
RGT Rengat-Sumatra Island
RIJ Rioja
RIL Rifle
RIV Riverside (March Air Reserve Base)
RME Rome (Nueva York)
RMG Rome (Georgia)
RMK Renmark
RMS Ramstein-Miesenbach
RND Universal City
RNE Saint-Léger-sur-Roanne
RNH New Richmond
ROD Robertson
ROZ Rota (España)
RPM Roper River
RPN Rosh Pina
RQW Qayyarah
RQY Shimoga
RRE Marree
RRJ Rio de Janeiro (Jacarepaguá)
RRK Rourkela
RSL Russell
RTC Ratnagiri
RTE São Paulo (Campo de Marte)
RUG Rugao
RUI Alto
RUV Rubelsanto
RVS Tulsa (Riverside)
RWF Redwood Falls
RWI Rocky Mount
RWL Rawlins
RWN Rivne
RYB Rybinsk
RYN Royan
RZA Puerto Santa Cruz
SAC Sacramento (Executive)
SBK Trémuson
SBL Santa Ana del Yacuma
SBU Springbok
SCH Schenectady
SCI San Cristóbal
SDB Langebaanweg
SDM San Diego (Brown)
SDT Saidu Sharif
SES Svetlogorsk
SFD San Fernando de Apure
SFE San Fernando
SFF Spokane (Felts)
SGE Burbach
SGH Springfield (Ohio)
SGI Sargodha
SGL Cavite
SGR Houston (Sugar Land)
SGZ Songkhla
SHT Shepparton
SIA Xi'an (Xiguan)
SIJ Siglufjörður
SIO Smithton
SIR Sion
SJX Sartaneja
SJY Seinäjoki
SKA Spokane (Fairchild Air Force Base)
SKF San Antonio (Lackland Air Force Base)
SKS Vojens
SKV Saint Catherine
SME Somerset
SMO Santa Monica
SMV Samedan
SNF San Felipe (Venezuela)
SNI Greenville (Liberia)
SNJ Sandino
SNR Saint-Nazaire
SNS Salinas (Estados Unidos)
SNY Sidney (Nebraska)
SNZ Rio de Janeiro (Santa Cruz Air Force Base)
SOO Söderhamn
SOT Sodankyla
SOZ Solenzara
SPM Trier
SQO Storuman
SQQ Šiauliai
SQW Skive
SSC Sumter (Shaw Air Force Base)
SSE Solapur
SSF San Antonio (Stinson)
SSI St Simons Island
SSN Seongnam
SSZ Guarujá
STA Skjern
STB San Carlos del Zulia
STJ St Joseph
STP Saint Paul
STY Salto
SUL Sui
SUS St Louis
SUU Fairfield (California)
SVN Savannah (Hunter Army Air)
SVP Kuito
SVW Sparrevohn
SWC Stawell
SWD Seward
SWH Swan Hill
SWS Swansea
SWT Strezhevoy
SWU Suwon
SWV Evensk
SXE Sale
SXI Siri
SXJ Shanshan
SXL Sligo
SXN Sowa
SXQ Soldotna
SXV Salem (India)
SXZ Siirt
SYA Shemya
SYJ Sirjan
SYP Santiago (Panamá)
SYT L'Hôpital-le-Mercier
SYW Sehwan Sharif
SZJ Isla de la Juventud
SZL Knob Noster
SZV Suzhou
TAF Tafraoui
TAR Grottaglie
TBF Tabiteuea North
TBW Tambov
TCC Tucumcari
TCE Mihail Kogălniceanu
TCL Tuscaloosa
TCM Tacoma (McChord Air Force Base)
TCS Truth or Consequences
TCX Tabas
TDG Tandag
TDL Tandil
TEA Tela
TEC Telêmaco Borba
TED Thisted
TEF Telfer
TEM Temora
TEU Manapouri
TEV Teruel
TGA Western Water Catchment
TGK Taganrog
TGN Morwell
TGP Bor
THU Pituffik
THZ Tahoua
TID Tiaret
TIK Oklahoma City (Tinker Air Force Base)
TIX Titusville
TJI Trujillo (Honduras)
TKA Talkeetna
TKC Tiko
TKH Takhli
TKT Tak
TLJ Takotna (Tatalina LRRS)
TLX Talca
TMB Miami (Executive)
TMO Tumeremo
TNF Toussus-le-Noble
TNW Ahuano
TOI Troy
TOJ Madrid (Torrejón)
TOP Topeka (Philip Billard)
TOQ Tocopilla
TPC Tarapoa
TPH Tonopah (TPH)
TPL Temple
TQD Al Habbaniyah
TQS Tres Esquinas
TRM Palm Springs (Jacqueline Cochran)
TRO Taree
TRQ Tarauacá
TSB Tsumeb
TTC Taltal
TTD Portland (Troutdale, Oregón)
TTG Tartagal
TTH Thumrait
TUD Tambacounda
TUM Tumut
TUV Tucupita
TVL South Lake Tahoe
TWZ Twitzel
TXC Orsha
TYB Tibooburra
TYM Staniel Cay
UAB Sarıçam
UAM Yigo
UDE Uden
UDJ Uzhhorod
UGO Uige
UHE Uherské Hradiště
UIP Quimper
UKI Ukiah
UKS Sevastopol
ULA San Julian
ULD Ulundi
ULQ Tuluá
UMB Kalumbila
UND Kunduz
UOX Oxford (Misisipi)
UPB Havana
UPL Upala
URO Boos
URS Kursk
USQ Uşak
UTI Utti
UTS Ust-Tsylma
UTW Queenstown (Sudáfrica)
UUN Baruun Urt
UZC Stapari
UZU Curuzu Cuatia
VAD Valdosta (Moody Air Force Base)
VAF Chabeuil
VAG Varginha
VBG Lompoc (Vandenberg Space Force Base)
VDP Valle de La Pascua
VDR Villa Dolores
VEY Vestmannaeyjar
VGD Vologda
VGT Las Vegas (North)
VHC Saurimo (VHC)
VHY Charmeil
VIN Vinnitsa
VIP Payerne
VIR Durban (Virginia)
VIS Visalia
VIY Vélizy-Villacoublay
VKV Arkhangelsk (Vaskovo)
VLG Villa Gesell
VLM Villamontes
VLR Vallenar
VLU Velikiye Luki
VLY Angelsey
VME Villa Mercedes
VMI Puerto Vallemi
VNE Vannes
VNY Van Nuys
VOD Vodochody
VOH Vohemar
VOK Camp Douglas
VPZ Valparaiso
VQQ Jacksonville (Cecil, Florida)
VRE Vredendal
VRK Varkaus
VRO Santa Marta (Cuba)
VRU Vryburg
VTB Vitebsk
VTM Beersheba (Nevatim)
VTN Valentine
WAI Antsohihy
WAT Waterford
WBG Jagel
WCH Chaitén
WFI Fianarantsoa
WGT Laceby
WHB Eliwana
WHN Wuhan (Hannan)
WIE Wiesbaden
WIR Wairoa
WJF Lancaster (Estados Unidos)
WKB Warracknabeal
WKF Pretoria (Waterkloof Air Force Base)
WMC Winnemucca
WME Mount Keith
WMH Mountain Home (Arkansas)
WMR Mananara Nord
WOE Hoogerheide
WOL Albion Park Rail
WPC Pincher Creek
WPR Porvenir
WPU Puerto Williams
WRB Warner Robins
WRI Wrightstown
WRL Worland
WRT Warton
WTN Lincoln (RAF Waddington, Reino Unido)
WVK Manakara
WWA Wasilla
WWD Wildwood
WWR Woodward
WWY West Wyalong
WYE Yengema
XEN Huludao
XFW Hamburg (Finkenwerder)
XGN Xangongo
XIJ Ahmed Al Jaber AB
XJD Ar Rayyan
XJM Mangla
XLS Saint Louis
XNH Nasiriyah
XRH Richmond (Nueva Gales del Sur)
XRR Ross River
XSB Sir Bani Yas
YAH La Grande-4
YAI Chillan
YAO Yaoundé (Ville)
YCC Cornwall
YCE Huron Park
YCH Miramichi
YCL Charlo
YCN Cochrane (Canadá)
YCQ Chetwynd
YDB Burwash Landing
YDG Digby
YDO Dolbeau-Saint-Felicien
YDQ Dawson Creek
YDT Delta (Canadá)
YEC Yecheon-ri
YEL Elliot Lake
YEM Sheguiandah
YEN Estevan
YEO Yeovil
YES Yasuj
YET Edson
YEY Amos
YFE Forestville
YFR Fort Resolution
YGK Kingston (Canadá)
YGM Gimli
YGQ Geraldton (Canadá)
YHD Dryden
YHF Hearst
YHN Hornepayne
YHT Haines Junction
YIB Atikokan
YIP Detroit (Willow Run)
YJF Fort Liard
YJN St Jean
YKD Kincardine
YKJ Key Lake
YKN Yankton
YKX Kirkland Lake
YKY Kindersley
YLD Chapleau
YLI Ylivieska
YLJ Meadow Lake
YLR Leaf Rapids
YLT Alert
YLY Langley
YMA Mayo
YME Matane
YMG Manitouwadge
YMJ Moose Jaw
YML Charlevoix
YNG Youngstown
YNM Matagami
YOA Ekati
YOD Cold Lake
YOO Oshawa
YOP Rainbow Lake
YOS Owen Sound
YPG Portage la Prairie
YPS Port Hawkesbury
YQF Springbrook
YQI Yarmouth
YQS St Thomas
YQV Yorkton
YQW North Battleford
YRI Rivière-du-Loup
YRQ Trois-Rivières
YRV Revelstoke
YSC Sherbrooke
YSH Smiths Falls
YSL Saint-Léonard
YSN Salmon Arm
YSP Marathon (Canadá)
YSU Slemon Park
YTA Pembroke
YTD Thicket Portage
YTF Alma (Canadá)
YTM La Macaza
YTR Trenton (Canadá)
YUA Chuxiong
YVE Vernon (Canadá)
YWY Wrigley
YXK Rimouski
YXQ Beaver Creek
YXR Earlton
YXZ Wawa
YYN Swift Current
YYU Kapuskasing
YYW Armstrong
YZA Cache Creek
YZE Gore Bay
YZH Slave Lake
YZR Sarnia
YZW Teslin
YZX Greenwood (Canadá)
ZAO Cahors
ZAR Zaria
ZBM Bromont
ZEC Secunda
ZER Ziro
ZFA Faro (Canadá)
ZGF Grand Forks (Canadá)
ZGU Gaua Island
ZIC Victoria (Chile)
ZJG Jenpeg
ZJN Swan River
ZRI Serui
ZST Stewart
ZTR Zhytomyr
ZTU Zaqatala
ZUC Ignace
ZVA Miandrivazo
ZVK Savannakhet
ZWA Andapa
ZXT Zabrat
ZZU Mzuzu
ZZV Zanesville
AAB Tanbar
AAD Adado
AAF Apalachicola
AAH Aachen
AAI Arraias
AAJ Awaradam
AAS Apalapsili
AAU Asau
ABF Abaiang
ABG Abingdon Downs
ABH Alpha
ABN Albina
ABO Aboisso
ABP Atkamba Mission
ACB Bellaire
ACD Acandí (Alcides Fernández)
ACM Arica (Colombia)
ACO Cóbano
ACP Maragheh
ACR Araracuara
ACU Mamitupu (Achutupu)
ADA Seyhan
ADC Andekombe
ADG Adrian
ADH Aldan
ADM Ardmore (ADM)
ADO Andamooka
ADR Andrews
ADS Dallas (Addison)
ADV El Daein
ADY Alldays
AEA Abemama
AEE Adar
AEK Aseki
AEL Albert Lea
AEM Amgu
AEO Aioun El Atrouss
AEQ Chifeng (Ar Horqin)
AFD Port Alfred
AFF Colorado Springs (USAF Academy)
AFI Amalfi
AFN Jaffrey
AFO Afton (Wyoming)
AFR Afore
AFS Zarafshan
AFT Bila
AGD Anggi-Papua Island
AGG Angoram
AGK Kagua
AGL Wanigela
AGO Magnolia
AGW Agnew
AHC Herlong
AHD Ardmore (Downtown Executive)
AHF Arapahoe
AHG Vingt Cinq
AHH Amery
AHI Amahai
AHL Aishalton
AHM Ashland (Oregón)
AHS Ahuas
AHY Ambatolahy
AHZ Huez
AIC Bigatyelang Island
AID Anderson (Indiana)
AIE Aiome
AIF Assis
AIG Yalinga
AIH Aiambak
AII Ali-Sabieh
AIK Aiken
AIL Isla Lorenzo Bello
AIM Ailuk Island
AIO Atlantic
AIR Aripuanã
AIS Arorae Island
AIV Aliceville
AIW Ai-Ais
AIY Araçuaí
AIZ Kaiser Lake Ozark
AJJ Akjoujt
AJK Araak
AJS Mulegé (Punta Abreojos)
AKE Akieni
AKG Anguganak
AKM ZaKouma
AKO Akron (Estados Unidos)
AKQ Menggala
ALD Fortaleza (Perú)
ALE Alpine
ALQ Alegrete
ALT Alenquer
ALU Alula
ALX Alexander City
AMB Ambilobe
AMC Am Timan
AME Alto Molocue
AMF Ama
AMJ Almenara
AMK Durango (Animas Air Park, Estados Unidos)
AML Puerto Armuelles
AMN Alma (Estados Unidos)
AMO Mao
AMP Ampanihy
AMT Amata
AMU Amanab
AMW Ames
AMX Ammaroo
AMY Ambatomainty
ANA Lolgorien
ANJ Zanaga
ANL Andulo
ANO Angoche
ANP Annapolis
ANQ Angola
ANW Ainsworth
ANY Anthony
ANZ Angus Downs Station
AOB Annanberg
AOD Abou-Deïa
AOH Lima (Estados Unidos)
AOM Adam (Omán)
AOP Andoas
AOU Attopeu
APB Apolo
APC Napa
APD Bone
APH Bowling Green (Virginia)
APP Asapa
APQ Arapiraca
APR April River
APS Anápolis
APT Jasper (Tennessee)
APU Apucarana
APV Apple Valley
APX Arapongas
APY Alto Parnaíba
AQB Santa Cruz del Quiché
AQM Ariquemes
AQY Girdwood
ARB Ann Arbor
ARF Acaricuara
ARG Walnut Ridge
ARL Arly
ARO Arboletes
ARP Aragip
ARQ Arauquita
ARR Alto Rio Senguerr
ARS Aragarças
ARV Woodruff
ARZ N'zeto
ASC Ascensión de Guarayos
ASG Ashburton
ASH Nashua
ASL Marshall (Texas)
ASN Talladega
ASQ Austin (Nevada)
ASS Arathusa
ASX Ashland (Wisconsin)
ASY Ashley
ASZ Asirim
ATB Atbara
ATD Atoifi
ATE Antlers
ATI Artigas
ATJ Antsirabe (Antananarivo)
ATN Namatanai
ATO Albany (Ohio)
ATP Aitape (ATP)
ATS Artesia
ATU Attu (Estados Unidos)
ATV Ati
ATX Atbasar
AUD Augustus Downs
AUE Ras Abu Rudeis
AUI Aua Island
AUJ Ambunti
AUM Austin (Minnesota)
AUN Auburn (California)
AUO Auburn (Alabama)
AUP Agaun
AUT Vila
AUV Aumo
AUY Anatom Island
AUZ Chicago (Aurora)
AVG Auvergne Station
AVO Avon Park
AVU Avu Avu
AVW Marana (AVW)
AVX Avalon
AWB Awaba
AWD Aniwa
AWE Wonga Wongué Presidential Reserve
AWM West Memphis
AWN Alton Downs
AWP Austral Downs
AWR Awar
AXB Alexandria Bay
AXC Aramac
AXE Xanxerê
AXG Algona
AXL Alexandria Homestead
AXO Kabir
AXS Altus (Quartz Mountain)
AXV Wapakoneta
AXX Angel Fire
AYA Ayapel
AYC Ayacucho (Colombia)
AYD Alroy Downs
AYG San Vicente del Caguán (Yaguara)
AYI Yari
AYK Arkalyk
AYL Anthony Lagoon
AYN Anyang (Yindu)
AYR Ayr
AYS Waycross
AYU Aiyura Valley
AYW Ayawasi
AZB Amazon Bay
AZG Apatzingán
AZH Azamgarh
AZJ Zhenjiang
AZL Sapezal
AZP Atizapán de Zaragoza
AZT Zapatoca
AZZ Ambriz
BAA Bialla
BAC Barranca De Upia
BAE Saint-Pons
BAJ Unea Island
BAM Battle Mountain
BAN Basongo
BBB Benson
BBC Bay City
BBH Barth
BBJ Bitburg
BBL Ballera
BBP Bembridge
BBV Grand-Béréby
BBW Broken Bow
BBX Philadelphia (Wings)
BBY Bambari
BBZ Zambezi
BCB Blacksburg
BCC Bear Creek
BCF Bouca
BCG Kumaka
BCJ Mianyang (Beichuan Yongchang)
BCK Bolwarra
BCP Bambu
BCR Boca do Acre
BCS Belle Chasse
BCV Belmopan
BCX Beloretsk
BCZ Bickerton Island
BDC Barra do Corda
BDF Bradford (Estados Unidos)
BDG Blanding
BDI Bird Island
BDK Bondoukou
BDN Badin
BDV Moba
BDW Bedford Downs
BDX Broadus
BDY Bandon
BDZ Baindoung
BEC Wichita (Beech Factory)
BEE Dampier Peninsula
BEH Benton Harbor
BEI Beica
BEO City of Lake Macquarie
BEV Beersheba (BEV)
BEZ Beru
BFA Bahía Negra
BFC Bloomfield River
BFG Bullfrog
BFR Bedford (Estados Unidos)
BFT Beaufort
BFW Sidi Bel Abbès
BGB Booue
BGD Borger
BGE Bainbridge
BGH Boghe
BGJ Borgarfjörður eystri
BGL Baglung
BGQ Big Lake
BGS Boguchany
BGT Bagdad
BGU Bangassou
BGV Bento Gonçalves
BHA Bahía de Caraquez
BHC Bhurban
BHF Bahía Solano (Cupica)
BHG Brus Laguna
BHL Ensenada (Bahía de los Ángeles)
BHN Beihan
BHP Bhojpur
BHT Brighton Downs
BHW Bhagatanwala
BIB Baidoa
BIC Bangor (Francia)
BIE Beatrice
BII Bikini Atoll
BIJ Biliau
BIN Bamyan
BIP Bulimba
BIT Baitadi
BIV Bria
BIW Billiluna
BIZ Bimin
BJE Baleela Base Camp
BJH Bajhang
BJJ Wooster
BJK Maikoor Island
BJP Bragança Paulista
BJQ Bahja
BJU Bajura
BJW Soa
BKD Breckenridge
BKJ Boké
BKP Barkly Downs
BKR Bokoro
BKT Blackstone
BKU Betioky
BKV Bailingmiao
BKX Brookings (Dakota del Sur)
BLC Bali (Camerún)
BLG Belaga
BLM Belmar
BLO Blönduós
BLP Bellavista
BLS Bollon
BLU Emigrant Gap
BLX Belluno
BLY Belmullet
BMB Bumba
BMC Brigham City
BMD Belo sur Tsiribihina
BMF Bakouma
BMH Bomai
BMJ Baramita
BML Berlin (Estados Unidos)
BMN Bamarni
BMP Brampton Island
BMQ Bamburi
BMS Brumado
BMT Beaumont (BMT)
BMX Big Mountain
BMZ Bamu
BNC Beni
BNG Banning
BNL Barnwell
BNM Bodinumu
BNR Banfora
BNT Bundi
BNU Blumenau
BNV Boana
BNW Boone
BOA Boma
BOE Boundji
BOK Brookings (Oregón)
BOP Bouar
BOV Boang Island
BOW Bartow
BOX Borroloola
BOZ Bozoum
BPA Borongan City
BPD Bapi
BPF Batuna Mission Station
BPK Biangabip
BQE Bubaque
BQI Bagani
BQO Bouna
BQQ Barra (Brasil)
BQR Kendek
BQW Balgo
BRB Barreirinhas
BRG Balirangen
BRH Brahman Mission
BRP Biaru
BRY Bardstown
BSE Sematan
BSF Waimea (Bradshaw Army)
BSI Balesin
BSM Amol
BSN Bossangoa
BSP Bensbach
BSQ Bisbee
BSS Balsas
BST Lashkar Gah (Bost)
BSU Basankusu
BSV Besakoa
BSW Boswell Bay
BSY Baardheere
BTA Bertoua
BTB Betou
BTD Brunette Downs
BTF Bountiful
BTG Batangafo
BTN Bennettsville
BTO Botopasi
BTP Butler (Pensilvania)
BTQ Butare
BTX Betoota
BTY Beatty
BUB Burwell
BUK Al-Bough
BUL Bulolo
BUM Butler (Misuri)
BUO Burao
BUV Bella Union
BUW Bau Bau
BUY Bunbury
BVK Itenes
BVL Baures
BVM Belmonte
BVO Bartlesville
BVU Beluga
BVV Kurilsk (Burevestnik)
BVW Batavia Downs
BVX Batesville (Arkansas)
BVZ Wunaamin Miliwundi Ranges (Beverley Springs)
BWB Barrow Island
BWC Brawley
BWD Brownwood
BWJ Bawan
BWL Blackwell
BWM Bowman
BWP Bewani
BWW Cayo Santa Maria
BXA Bogalusa
BXD Bade
BXF Pumululu National Park
BXI Boundiali
BXJ Boralday
BXK Buckeye
BXM Batom
BXN Bodrum (Imsık)
BXO Buochs
BXS Borrego Springs
BXV Breiðdalsvík
BXW Bawean
BXX Borama
BXZ Bunsil - Umboi Island
BYA Boundary
BYB Dibba al Baya
BYD Al-Bayda
BYF Albert
BYG Buffalo (Estados Unidos)
BYL Beliyela
BYP Barimunya
BYT Bantry
BYX Baniyala
BZA Bonanza
BZF Redding (Benton)
BZH Bumi
BZJ Bozhou
BZM Bemolanga
BZP Lakefield National Park
BZT Brazoria
CAA El Aguacate
CAD Cadillac
CAM Camiri
CAO Clayton
CAV Cazombo
CBC Cherrabun
CBE Wiley Ford
CBF Council Bluffs
CBI Cape Barren Island
CBK Colby
CBN Cirebon-Java Island
CBS Cabimas
CBW Campo Mourão
CBX Condobolin
CBY Canobie
CBZ Binzhou
CCB Upland
CCG Crane
CCI Concórdia (Brasil)
CCN Chaghcharan
CCO Puerto López
CCW Cowell
CCX Cáceres
CDA Cooinda
CDD Cauquira
CDH Camden (Arkansas)
CDI Cachoeiro do Itapemirim
CDK Cedar Key
CDL Candle
CDN Camden (Carolina del Sur)
CDO Cradock
CDQ Croydon
CDW Caldwell
CDY Mapun
CEA Wichita (Cessna Aircraft)
CEH Chelinda
CEO Waco Kungo
CEP Concepción (Bolivia)
CES Cessnock
CET Cholet
CEU Clemson
CEV Connersville
CEX Chena Hot Springs
CEY Murray
CFC Caçador
CFD Bryan
CFF Cafunfo
CFH Clifton Hills
CFI Camfield
CFM Conklin
CFO Confresa
CFP Carpentaria Downs
CFQ Creston (Canadá)
CFT Clifton
CFV Coffeyville
CGC Cape Gloucester
CGE Cambridge (Estados Unidos)
CGG Casiguran
CGL Chagual
CGS College Park
CGV Caiguna
CGX Chunga
CGZ Casa Grande
CHB Chilas
CHD Mucugê
CHF Jinhae
CHJ Chipinge
CHK Chickasha
CHL Challis
CHN Jeonju
CHP Circle Hot Springs
CHZ Chiloquin
CIC Chico
CIE Collie
CIG Craig (Estados Unidos)
CII Aydın
CIL Council
CIM Cimitarra
CIN Carroll
CIP Chipata
CIQ Chiquimula
CIR Cairo (Estados Unidos)
CIZ Coari
CJD Candilejas
CJF Coondewanna
CJH Chilko Lake
CJT Comitán
CKA Cherokee
CKE Lakeport
CKI Croker Island
CKK Ash Flat
CKM Clarksdale
CKN Crookston
CKO Cornélio Procópio
CKR Crane Island
CKU Cordova (CKU)
CKV Clarksville
CLA Comilla
CLG Coalinga
CLH Coolah
CLI Clintonville
CLK Clinton (CLK, Oklahoma)
CLR Calipatria
CLS Chehalis
CLW Clearwater
CLX Clorinda
CMC Camocim
CMJ Qimei
CMK Club Makokola
CML Camooweal
CMM Carmelita
CMO Hobyo
CMP Santana do Araguaia
CMS Iskushuban
CMT Cametá
CMV Coromandel
CMY Sparta (Wisconsin)
CMZ Caia
CNA Cananea
CNE Penrose
CNH Claremont
CNK Concordia (Estados Unidos)
CNO Chino
CNT Charata
CNV Canavieiras
CNW Waco (TSTC)
CNZ Cangamba
COA Columbia (California)
COB Coolibah
COG Condoto
COH Cooch Behar
COI Merritt Island
COM Coleman
COP Cooperstown
COT Cotulla
COW Coquimbo
COY Coolawanyah Station
COZ Costanza
CPA Harper
CPB Acandí (Capurganá)
CPF Blora
CPG Carmen de Patagones
CPI Cape Orford
CPL Chaparral
CPM Compton
CPN Cape Rodney
CPP Pica
CPS Cahokia
CPU Cururupu
CQA Canarana
CQP Cape Flattery
CQS Costa Marques
CQT Caquetania
CRB Collarenebri
CRF Carnot
CRH Cherrabah Homestead Resort
CRJ Coorabie
CRO Corcoran
CRR Ceres
CRS Corsicana
CRT Crossett
CRX Corinth
CRY Carlton Hill
CSC Cañas
CSD Cresswell Downs
CSE Crested Butte
CSI Casino
CSM Clinton (Sherman, Oklahoma)
CSO Hecklingen
CSQ Creston (Estados Unidos)
CSR Casuarito
CSS Cassilândia
CSU Santa Cruz do Sul
CSZ Coronel Suarez
CTE Cartí Islands
CTF Coatepeque
CTH Coatesville
CTI Cuito Cuanavale
CTK Canton
CTO Calverton
CTP Carutapera
CTQ Santa Vitória do Palmar
CTR Cattle Creek
CTV Saurimo (Catoca)
CTW Cottonwood
CTX Cortland
CTY Cross City
CTZ Clinton (Carolina del Norte)
CUD Caloundra
CUG Cudal
CUH Cushing
CUI Currillo
CUJ Culion
CUO Carurú
CUS Columbus (Nuevo México)
CUV Casigua El Cubo
CUY Cue
CVB Chungribu
CVF Saint-Bon
CVH Lafontaine
CVI Caleta Olivia
CVL Cape Vogel
CWF Lake Charles (Chennault)
CWI Clinton (Iowa)
CWK Chitrakoot
CWR Cowarie
CWX Willcox
CXC Chitina
CXF Coldfoot
CXL Calexico
CXN Candala
CXQ Wangkat Jungka
CXT Charters Towers
CXY North Cat Cay
CYD Maya Flats
CYL Coyoles
CYR Colonia del Sacramento
CZA Tinúm
CZB Cruz Alta
CZC Copper Center
CZJ Tupile
CZK Cascade Locks
CZN Chisana
CZO Chistochina
CZR Chara
CZT Carrizo Springs
CZY Cluny
DAF Daup
DAH Dathina
DAK Dakhla Oases
DAO Dabo
DAP Darchula
DAS Great Bear Lake
DAZ Darwaz
DBN Dublin (Georgia)
DBP Debepare
DBS Dubois (Estados Unidos)
DBT Debre Tabor
DBY Dalby
DCK Dahl Creek
DCU Decatur (Alabama)
DDD Kudahuvadhoo
DDM Dodoima
DDN Delta Downs
DDU Dadu
DEH Decorah
DEI Denis Island
DEP Daporijo
DEQ Huzhou
DER Derim
DES Desroches Island
DFA Shangluo
DFI Defiance
DFP Palmer (Australia)
DGD Dalgaranga Gold Mine
DGF Douglas Lake
DGL Douglas (Arizona)
DGN Dahlgren
DGR Dargaville
DGU Dedougou
DGW Douglas (Wyoming)
DHD Durham Downs
DHG Dalnegorsk
DHI Dhangarhi
DIM Dimbokro
DIP Diapaga
DIQ Divinópolis
DJA Djougou
DJM Djambala
DJN Delta Junction
DJR Dajarra
DJU Djúpivogur
DKI Dunk Island
DKK Dunkirk
DKV Kaltukatjara
DLK Dulkaninna
DLL Dillon (Carolina del Sur)
DLN Dillon (Montana)
DLV Delissaville
DLY Dillon's Bay
DMO Sedalia
DMT Diamantino
DNB Maramie (Dunbar)
DNF Martuba
DNG Drysdale River (Doongan)
DNN Dalton
DNO Dianópolis
DNP Dang
DNS Denison (Iowa)
DNU Dinangat
DNV Danville (Illinois)
DNX Dinder
DOA Doany
DOB Dobo-Warmar Island
DOE Djumu-Djomoe
DOI Castori Islets
DON Dos Lagunas
DOO Dorobisoro
DOR Dori
DOU Dourados
DOX Port Denison
DPB Bahia Inutil
DPE Saint-Aubin-sur-Scie
DPG Dugway Proving Ground
DRC Dirico
DRD Dorunda Outstation
DRE Drummond Island
DRF Kenai (Drift River)
DRH Dabra
DRK Puntarenas (Drake Bay)
DRR Durrie
DRU Drummond
DRY Drysdale River (DRY)
DSC Dschang
DSG Dilasag
DSV Dansville
DSX Kaohsiung (Dongsha Island)
DTA Delta (Estados Unidos)
DTH Death Valley
DTI Diamantina
DTL Detroit Lakes
DTN Shreveport (Downtown)
DTX Dallas (McKinney National)
DUC Duncan (Estados Unidos)
DUF Corolla
DUK Mubatuba
DUQ Duncan (Canadá)
DVD Andavadoaka
DVK Diavik
DVN Davenport
DVP Davenport Downs
DVR Nauiyu
DVT Phoenix (Deer Valley)
DWH Houston (David Wayne Hooks)
DWR Reg
DWS Hulunbuir
DXD New Dixie
DXE Madison (Misisipi)
DYL Doylestown
DYM Diamantina Lakes
DYW Daly Waters
DZI Codazzi
DZU Dazu
EAB Abs
EAE Emae Island
EAL Mejato Island
EAN Wheatland
EBN Ebadon Island
EBO Ebon Atoll
EBS Webster City
EBW Ebolowa
ECA East Tawas
ECI Tola
ECO El Encanto
ECR El Charco
ECS Newcastle (Estados Unidos)
EDB Al Dabbah
EDD Ghan (Erldunda)
EDE Edenton
EDK El Dorado (Estados Unidos)
EDN Yedinka
EDQ Erandique
EFG Efogi
EFK Newport (Vermont)
EFW Jefferson
EGA Engati
EGL Negele Borana
EGM Sege
EGN Geneina
EGP Eagle Pass
EGV Eagle River
EIH Einasleigh
EIY Sapir
EJN Ejin Banner
EKD Elkedra
EKI Elkhart
EKX Elizabethtown
ELA Eagle Lake
ELE El Real de Santa María
ELJ Ruperto Polania
ELK Elk City
ELL Ellisras
ELN Ellensburg
ELO El Dorado (Argentina)
ELR Elelim
ELT At Tur
ELX El Tigre (El)
ELZ Wellsville
EMG Empangeni
EMI Emirau Island
EMM Kemmerer
EMN Néma
EMO Emo Mission
EMP Emporia
EMS Embessa
EMT El Monte
EMX El Maitén
EMY El Minya
ENB Eneabba
ENG Enggano
ENJ El Naranjo
ENL Centralia
EOK Keokuk
EOS Neosho
EPG Weeping Water
EPH Ephrata
EPT Eliptamin
ERA Erigavo
ERB Ernabella
ERE Erave
ERG Erbogachen
ERM Erechim
ERN Eirunepé
ERQ Elrose Mine
ERR Errol
ERT Erdenet
ERU Erume
ERV Kerrville
ESA Esa'ala
ESN Easton (Maryland)
ESO Espanola
ESS Essen
EST Estherville
ESW Easton (Washington)
ETB West Bend
ETD Etadunna
ETE Metema
ETL Svetlaya
ETN Eastland
ETS Enterprise
EUC Eucla
EUE Eureka (Nevada)
EUF Eufaula
EUM Neumünster
EUO Paratebueno
EVD Eva Downs
EVH Evans Head
EVM Eveleth
EWE Agats
EWI Enarotali
EWK Newton (Kansas)
EWO Ewo
EXM Exmouth (EXM)
EYA Zeya
EYL Yélimané
EYR Yerington
EYS Eliye Springs
FAA Faranah
FAC Faaite
FAG Fagurhólsmýri
FAH Farah
FAM Farmington (Misuri)
FAQ Frieda River
FAU Fahud
FBA Fonte Boa
FBL Faribault
FBR Fort Bridger
FBY Fairbury
FCH Fresno (Chandler Executive)
FCM Minneapolis (Flying Cloud)
FCY Forrest City
FDA Fundación
FDK Frederick (Maryland)
FDR Frederick (Oklahoma)
FEB Sanfebagar
FEJ Feijó
FEP Freeport (Estados Unidos)
FET Fremont
FFA Kill Devil Hills
FFL Fairfield (Iowa)
FFM Fergus Falls
FFT Frankfort
FFU Futaleufú
FGD Fderik
FGI Apia (Fagali'i)
FID Fishers Island
FIG Fria
FIK Finke
FIL Fillmore
FIN Buki
FKN Franklin (Virginia)
FLB Floriano
FLD Fond du Lac
FLF Flensburg
FLH Flotta Isle
FLM Filadelfia
FLP Flippin
FLT Flat
FLV Fort Leavenworth
FLX Fallon (FLX)
FLY Finley
FMG Brasilito
FMH Falmouth
FMS Fort Madison
FMU Florence (Estados Unidos)
FNE Fane Mission
FNG Fada N'gourma
FNH Fincha
FNU Oristano
FOB Fort Bragg (California)
FOK Westhampton Beach
FOO Nomfor
FOT Forster
FOU Fougamou
FOY Foya
FPY Perry (Florida)
FRC Franca
FRH French Lick
FRK Frégate Island
FRM Fairmont
FRN Fort Richardson
FRQ Feramin
FRR Front Royal
FRT Frutillar
FRY Fryeburg
FSK Fort Scott
FSL Fossil Downs Station
FSU Fort Sumner
FUB Fulleborn
FUL Fullerton
FUM Fuma
FVL Flora Valley
FVM Fuvahmulah Island
FVR Oombulgurri
FWL Farewell
FXO Cuamba
FXY Forest City
FYM Fayetteville (Tennessee)
FZL Fuzuli
GAA Guamal
GAB Gabbs
GAC Gracias
GAD Gadsden
GAG Gage
GAH Gayndah
GAI Gaithersburg
GAP Gusap
GAR Garaina
GAS Garissa
GAT Tallard
GAV Gag Island
GAW Gangaw
GAZ Woodlark
GBA Cirencester
GBC Gasuke
GBD Great Bend
GBF Negarbo
GBG Galesburg
GBH Galbraith Lake
GBK Gbangbatok
GBL South Goulburn Is
GBM Garbaharey
GBP Gamboola
GBR Great Barrington
GBU Khashm El Girba
GBV Gibb
GBW Ginbata
GCA Guacamayas
GCD Electric City
GCT Littlefield
GCV Gravatai
GCW Peach Springs (Grand Canyon West)
GCY Greeneville
GDC Greenville (Donaldson, Carolina del Sur)
GDD Gordon Downs
GDI Melle
GDM Gardner
GDP Guadalupe
GDR Angra dos Reis
GDW Gladwin
GEB Gebe Island
GED Georgetown (Delaware)
GEE George Town (Australia)
GEF Liangia
GEW Gewoia
GEY Greybull
GFD Greenfield
GFE Grenfell
GFO Bartica
GGB Água Boa
GGC Lumbala N'guimbo
GGD Gregory Downs
GGE Georgetown (Carolina del Sur)
GGH Cianorte
GGM Kakamega
GGN Gagnoa
GGO Guiglo
GHE Garachiné
GHF Giebelstadt
GHK Kennedy Lake
GHM Centerville
GHS Melak-Borneo Island
GIF Winter Haven
GII Siguiri
GIM Miele Mimbale
GIT Geita
GIU Sigiriya
GIY Giyani
GJR Gjögur
GKD Gökçeada
GKH Gorkha
GKL Great Keppel Island
GKT Sevierville
GLB Globe
GLC Geladi
GLE Gainesville (Texas)
GLG Glengyle
GLL Klanten flyplass
GLM Glenormiston
GLN Guelmim
GLP Gulgubip
GLR Gaylord
GLW Glasgow (Kentucky)
GLX Galela
GMC Puerto Carreño (Guerima)
GMD Ben Slimane
GMM Gamboma
GMN Greymouth
GMS Guimarães
GMT Granite Mountain
GMV Oljato-Monument Valley
GNF Quincy (Estados Unidos)
GNG Gooding
GNI Lüdao
GNM Guanambi
GNN Ghinnir
GNR General Roca
GNT Grants
GNZ Ghanzi
GOB Goba
GOC Gora
GOE Gonaili
GOG Gobabis
GOK Guthrie
GOL Gold Beach
GOO Goondiwindi
GOR Gore
GOS Gosford
GPB Guarapuava
GPD Mount Gordon Mine
GPZ Grand Rapids (Estados Unidos)
GQQ Galion
GRA Puerto Mosquito
GRC Grand Cess
GRD Greenwood (Carolina del Sur)
GRE Greenville (Illinois)
GRG Gardez
GRL Au
GRM Grand Marais
GRN Gordon
GRP Gurupi
GRT Gujrat
GSA Long Miau
GSC Gascoyne Junction
GSH Goshen
GSI Grand-Santi
GSL Taltheilei Narrows
GSN Mount Gunson
GSQ Sharq El Owainat
GSR Gardo
GSS Belfast (Sudáfrica)
GTC Chato District
GTG Grantsburg
GTI Dreschvitz
GTK Sungai Tekai
GTP Grants Pass
GTS The Granites Gold Mine
GTT Georgetown (Australia)
GTY Gettysburg
GTZ Grumeti Game Reserve
GUD Goundam
GUE Guriaso
GUF Gulf Shores
GUG Guari
GUO Guriel
GUU Grundarfjörður
GUV Mougulu
GUX Guna
GVE Gordonsville
GVI Green River (Papúa Nueva Guinea)
GVL Gainesville (Georgia)
GVP Greenvale
GVT Greenville (Texas)
GWA Gwa
GWS Glenwood Springs
GWV Glendale (Virginia Occidental)
GXM Kuala Kurun
GXX Yagoua
GXY Greeley
GYB Wodgina
GYL Argyle
GYO Kabupaten Gayo Lues
GYP Gympie
GYR Goodyear
GZI Ghazni
HAB Hamilton (Alabama)
HAF Half Moon Bay
HAI Three Rivers
HAO Hamilton (Ohio)
HAR Harrisburg (Capital City)
HAT Shelburne
HAY Aguachica
HAZ Hatzfeldhaven
HBB Hobbs (Industrial Airpark)
HBD Habi
HBK Holbrook
HBU Bulgan (Mongolia)
HCA Big Spring
HCC Hudson
HCM Eyl
HCW Cheraw
HDE Holdrege
HDH Mokuleia
HDR Bandar Abbas (Havadarya)
HEB Hinthada
HED Herendeen Bay
HEE West Helena
HEG Heglig
HEO Haelogo
HES Hermiston
HEW Jinhua
HEZ Natchez
HFF Hoffman
HGE Higuerote
HGS Freetown (Hastings)
HGZ Hogatza
HHI Wahiawa
HIE Whitefield
HIG Highbury
HIP Headingly
HIT Haivaro
HJT Khujirt
HKA Blytheville (HKA)
HKB Healy Lake
HKR Mara Rianta (North Conservancy)
HKS Jackson (Hawkins, Misisipi)
HLB Batesville (Indiana)
HLC Hill City
HLF Hultsfred
HLI Hollister
HLJ Suihua
HLL Hillside
HLM Holland
HLS St Helens
HLV Helenvale
HLW Hluhluwe
HMG Hermannsburg
HMR Hamar
HMT Hemet
HMY Seosan
HNB Huntingburg
HNC Hatteras
HNI Heiweni
HNN Honinabi
HOA Hola
HOC Komako
HOE Huay Xai
HOH Hohenems
HOO Đăk R'Lấp
HOS Chos Malal
HOX Hommalinn
HPE Hope Vale
HPT Hampton (Iowa)
HPV Hanalei
HPY Baytown
HRA Mnichovo Hradiště
HRC Zhayrem
HRH Aligarh
HRR Campiña
HRY Ghan (Henbury)
HRZ Horizontina
HSB Harrisburg (Estados Unidos)
HSF Suifenhe
HSH Las Vegas (Henderson Executive)
HSI Hastings
HSJ Zhengzhou (Shangjie)
HSK Monflorite
HSP Hot Springs (Estados Unidos)
HTH Hawthorne (Estados Unidos)
HTL Houghton Lake
HTM Hatgal
HTO East Hampton
HTR Taketomi
HTW South Point
HTZ Hato Corozal
HUB Humbert River
HUC Humacao
HUD Humboldt
HUJ Hugo
HUK Hukuntsi
HUM Houma
HUQ Hon
HUV Hudiksvall
HUW Humaitá
HVE Hanksville
HVK Hólmavík
HVS Hartsville
HWA Hawabango
HWD Hayward (California)
HWK Hawker
HYC Marlow
HYF Bainyik
HYV Hyvinkää
HZL Hazleton
HZP Fort Mackay
HZV Hazyview
IAL Ialibu
IAQ Imam Hassan
IAX Miangas
IBI Iboki
IBM Japal Camp
IBO Ibo
ICA Ikabarú
ICK Nieuw Nickerie
ICL Clarinda
ICO Carles
ICS Cascade
ICY Icy Bay
IDB Idre
IDF Idiofa
IDG Ida Grove
IDH Grangeville
IDI Indiana
IDK Indulkana
IDN Indagen
IDO Cristalândia
IDP Independence (Estados Unidos)
IDY Île d'Yeu
IES Riesa
IFA Iowa Falls
IFF Iffley
IFH Hesa
IFL Innisfail
IFU Ifuru Island
IGB Ingeniero Jacobacci
IGE Iguela
IGH Ingham
IGN Balo-i
IGO Chigorodó
IHC Inhaca
IHN Qishn
IHO Ihosy
IHU Ihu
IIS Nissan Island
IJU Ijuí
IJX Jacksonville (Illinois)
IKB North Wilkesboro
IKL Ikela
IKP Inkerman
ILA Ilaga
ILE Killeen (Skylark)
ILK Ilaka
ILL Willmar
ILU Kilaguni
IMA Iamalele
IMB Imbaimadai
IMD Imonda
IMG Inhaminga
IMI Arno Atoll (Ine)
IML Imperial (Estados Unidos)
IMM Immokalee
IMN Imane
IMO Zemio
IMZ Ziarat-e Amiran Saseb
INE Chinde
INF In Guezzam
INJ Injune
INM Innamincka
INS Indian Springs
INX Inanwatan
INY Inyati
IOK Iokea
ION Impfondo
IOP Ioma
IOW Iowa City
IPA Ipota
IPE Ipil
IPG Santo Antônio do Içá
IPU Ipiaú
IPZ Pérez Zeledón
IRB Iraan
IRE Irecê
IRM Igrim
IRN Iriona
IRO Birao
IRS Sturgis
ISD Iscuandé
ISI Isisford
ISJ Isla Mujeres
ISQ Manistique
ISS Wiscasset
ISW Wisconsin Rapids
ITE Ituberá
ITI Itambacuri
ITJ Itajaí
ITK Itokama
ITN Itabuna
ITP Itaperuna
ITQ Itaqui
ITR Itumbiara
IUA Ontario County IDA
IUL Ilu
IUP Apuí
IVA Ampampamena
IVG Berane
IVI Isla Viveros
IVO Chivolo
IVW Inverway
IWS Houston (West)
IXN Khowai
IXQ Manik Bhandar
IXT Pasighat
IYK Inyokern
IZE Hohenlockstedt
IZM Selçuk
JAB Jabiru
JAP Puntarenas (Chacarita)
JAQ Jacquinot Bay
JAR Jahrom
JAS Jasper (Texas)
JAT Ailinglapalap Atoll (Jabot)
JAW Araripina
JBS São Borja
JCB Joaçaba
JCI New Century
JCM Jacobina
JCS Crateús
JCY Stonewall
JDA John Day
JDN Jordan
JDR São João Del Rei
JEF Jefferson City
JEK Jeki
JEQ Jequié
JHL Albian Village
JHN Mandailing
JIA Juína
JIL Jilin
JIN Jinja
JIP Jipijapa
JIR Jiri
JKV Jacksonville (Texas)
JLA Cooper Landing
JLS Jales
JMA Manhuaçu
JMB Jamba
JMR Maricá
JNA Januária
JNJ Duqm (Ja'Aluni)
JOJ Hope Bay (Doris Lake)
JOM Njombe
JOP Josephstaal
JOT Joliet
JPO Patos
JPY Paraty
JQE Jaqué
JRJ Ganzhou (Ruijin)
JRN Juruena
JRT Juruti
JSB São Benedito
JSM Chubut
JTA Tauá
JTI Jataí
JTN Itanhaém
JUA Juara
JUN Jundah
JUO Juradó
JUR Jurien Bay
JUT Jutigalpa
JVA Ankavandra
JVI Manville
JVL Janesville
KAF Karato
KAK Kar
KAM Kamaran
KAP Kapanga
KAQ Kamulai Mission
KAR Kamarang
KAS Karasburg
KAV Kavanayén
KAY Wakaya Island
KAZ Kao
KBA Kabala
KBB Kirkimbie
KBD Kimberley Downs
KBF Karubaga
KBH Kahama
KBI Kribi
KBJ Petermann (Kings Canyon)
KBM Kabwum
KBN Kabinda
KBO Kabalo
KBQ Kasungu
KBT Kaben
KBX Kambuaya-Papua Island
KBY Streaky Bay
KBZ Kaikoura
KCB Kasikasima
KCD Kamur
KCE Collinsville
KCF Kandanwari
KCI Koolan Island
KCJ Komaio
KCK Kirensk
KCL Chignik Flats
KCP Kamyan'ka
KCR Colorado Creek
KCS Petermann (Kings Creek)
KCU Masindi
KDA Kolda
KDB Kambalda West
KDC Kandi
KDE Koroba
KDJ N'Djolé
KDK Kodiak (KDK)
KDN Ndende
KDP Kandep
KDQ Kamberatoro Mission
KDR Kandrian
KDS Kamaran Downs
KDX Kadugli
KDY Khandyga
KEA Kerki
KEC Kasenga
KED Kaédi
KEE Kelle
KEG Denglagu Mission
KEI Kepi
KEK Ekwok
KEO Odienne
KEQ Kebar
KEU Keekorok
KEX Kanabea
KEY Kericho
KFA Kiffa
KFE Cloudbreak Village
KFM Kirby Lake
KGB Konge
KGH Yongai
KGM Kungim
KGN Kasongo-Lunda
KGO Kirovograd
KGR Ghan (Kulgera)
KGU Keningau
KGW Kagi
KGZ Glacier Creek
KHA Khaneh
KHC Kerch
KHO Khoka Moya
KHR Kharkhorin
KHU Kremenchuk
KHW Khwai River Lodge
KHY Khoy
KIC King City
KIG Koingnaas
KII Kibuli
KIL Kilwa
KIP Wichita Falls (Kickapoo Downtown)
KIQ Kira
KIU Kiunga (Kenia)
KIY Kilwa Masoko
KJJ Kampala
KJP Zamami
KJX Blangpidie
KKD Kokoda
KKG Konawaruk
KKK Kalakaket Creek
KKO Kaikohe
KKP Koolburra
KKQ Krasnoselkup
KKT Kentland
KKU Ekuk
KKY Kilkenny
KKZ Krong Khemara Phoumin
KLB Kalabo
KLE Kaélé
KLI Kotakoli
KLK Kalokol
KLL Levelock
KLM Kalaleh
KLY Kalima
KMB Konambe
KMF Hoieti
KMK Makabana
KML Kamileroi
KMM Kimaam
KMR Karimui
KMV Kalemyo
KMZ Kaoma
KNB Kanab
KNE Kanainj
KNI Katanning
KNJ Kindamba
KNM Kaniama
KNN Kankan
KNP Capanda
KNT Kennett
KNY Kodinsk
KNZ Kenieba
KOD Kotabangun-Borneo Island
KOF Komatipoort
KOH Maramie (Koolatah)
KOM Komo
KOO Kongolo
KOQ Köthen
KOR Kakoro
KOX Kokonao
KPA Kopiago
KPE Yapsiei
KPF Kondobol
KPI Kapit
KPL Kapal
KPM Kompiam
KPP Kalpower
KPT Jackpot
KQL Kol
KRD Kurundi Station
KRG Karasabai
KRJ Amboin
KRM Karanambo
KRQ Kramatorsk
KRU Gunim
KRV Kimwarer
KRX Kar Kar Island
KRZ Kiri
KSB Kasonombe
KSE Kasese
KSG Kisenden
KSI Kissidougou
KSP Kosipe Mission
KSS Sikasso
KSV Springvale (Queensland)
KSW Kiryat Shmona
KSX Yasuru
KTC Katiola
KTF Takaka
KTJ Kichwa Tembo
KTO Kato
KTV Kamarata
KTY Kalutara
KUB Seria
KUC Kuria
KUE Kolombangara Island
KUP Kupiano
KUQ Kuri
KUR Skazar
KUX Kuyol
KUY Kamusi
KVE Kitava Island
KVR Kavalerovo
KWD Kavadja
KWH Khwahan
KWO Kawito
KWS Kwailabesi
KXD Kondinskoye
KXU Katiu
KYB Ken's Bore
KYF Yeelirrie
KYI Yalata Mission
KYO Tampa (North Aero Park)
KYT Kyauktu
KYX Yalumet
KZD Krakor
KZF Kaintiba
KZG Kitzingen
LAB Lab Lab Mission
LAC Pulau Layang-Layang
LAH Labuha-Halmahera Island
LAM Los Alamos
LBK Liboi
LBM Luabo
LBN Akorian
LBO Lusambo
LBZ Lucapa
LCB Pontes e Lacerda
LCD Louis Trichardt
LCF Rio Dulce
LCI Laconia
LCM La Cumbre
LCN Balcanoona
LCO Lague
LCP Loncopue
LCQ Lake City
LCS Dehong
LCT Shijiazhuang (Luancheng)
LDA Malda
LDC Lindeman Island
LDI Lindi
LDJ Linden
LDK Lidköping
LDM Ludington
LDN Lamidanda
LDO Aurora (Surinam)
LDW Lansdowne Station
LDZ Londolozi
LEF Lebakeng
LEK Labé
LEM Lemmon
LEO Lekoni
LEP Leopoldina
LES Lesobeng
LEW Auburn (Maine)
LEZ La Esperanza
LFB Lumbo
LFH Lanping Bai
LFN Louisburg
LFO Kelafo
LFP Lakefield
LGC LaGrange
LGD La Grande
LGE Lake Gregory
LGF Yuma Proving Ground
LGN Linga Linga
LGO Langeoog
LGQ Lago Agrio
LGT La Gaviota
LGX Luuq
LHI Lereh-Papua Island
LHU Muneambuanas
LHV Lock Haven
LIA Liangping
LIB Limbunya
LIC Limon (Estados Unidos)
LIE Libenge
LII Mulia-Papua Island
LIJ Lishui
LIV Livengood
LIX Likoma Island
LIY Hinesville
LIZ Limestone
LJA Lodja
LKC Lekana
LKD Lakeland Downs
LKH Long Akah
LKK Kulik Lake
LKP Lake Placid
LKR Las Khorey
LKV Lakeview
LKW Lekhwair
LLE Malelane
LLG Chillagoe
LLH La Lima
LLI Girany Amba
LLJ Lubuk Linggau
LLL Lissadell Station
LLM Lomlom
LLN Kelila
LLS Las Lomitas
LLT Lobito
LLX Lyndonville
LLY Lumberton (Nueva Jersey)
LMB Salima
LMD Los Menucos
LMH Limón (Honduras)
LMI Lumi
LML Lae Island
LMS Louisville (Estados Unidos)
LMU Bukit Padi
LMV Naifaru
LMX Micay
LMZ Palma
LNA West Palm Beach (Park)
LNC Lengbati
LNF Munbil
LNG Lese
LNH Alpurrurulam
LNI Point Lonely
LNM Langimar
LNN Willoughby
LNP Wise
LNR Spring Green
LOA Lorraine
LOB Los Andes
LOC Lock
LOI Lontras
LOM Lagos de Moreno
LOT Chicago (Lewis University)
LOW Louisa
LOY Loiyangalani
LPC Lompoc (LPC)
LPE La Primavera
LPJ Guayabal
LPN Leron Plains
LPO La Porte
LQK Pickens
LQN Qala-i-Naw
LRA Larissa
LRB Leribe
LRG Loralai
LRJ Le Mars
LRQ Laurie River
LSB Lordsburg
LSJ Long Island (Papúa Nueva Guinea)
LSK Lusk
LSM Long Semado
LSN Los Banos
LSO Les Sables-d'Olonne
LSQ Los Angeles (Chile)
LSS Les Saintes
LSU Long Sukang
LSZ Mali Lošinj
LTC Lai
LTF Leitre
LTG Langtang
LTL Lastourville
LTP Lyndhurst
LTV Lotus Vale
LTW California
LUB Lumid Pau
LUC Laucala Island
LUE Lučenec
LUI La Unión
LUL Laurel
LUT Laura Station
LUU Laura
LVD Lime Village
LVK Livermore
LVL Lawrenceville (Virginia)
LVR Lucas do Rio Verde
LWA Lebak
LWC Lawrence (Kansas)
LWE Lewoleba
LWH Lawn Hill
LWI Lowai
LWL Wells
LWV Lawrenceville (Vincennes, Illinois)
LXN Lexington (Estados Unidos)
LXU Lukulu
LXV Leadville
LYK Lunyuk
LYO Lyons
LYT Lady Elliot Island
LZA Luiza
LZI Luozi
LZM Luzamba
LZR Lizard Island
LZU Lawrenceville (Georgia)
MAC Macon (Downtown)
MAE Madera
MAL Mangole Island
MAP Mamai
MAT Matadi
MAV Maloelap Island
MAW Malden
MBB Marble Bar
MBC M'Bigou
MBF Porepunkah
MBH Maryborough
MBK Matupá
MBM Mkambati
MBN Wunaamin Miliwundi Ranges (Mount Barnett)
MBP Moyobamba
MBQ Mbarara
MBU Mbambanakira
MBV Masa
MBY Moberly
MBZ Maués
MCA Macenta
MCD Mackinac Island
MCL Denali Park
MDB Hope Creek
MDD Midland (Airpark)
MDF Medford (Estados Unidos)
MDJ Madras
MDM Munduku
MDN Madison (Indiana)
MDO Middleton Island
MDP Mindiptana-Papua Island
MDR Mara Rianta (Musiara)
MDS Middle Caicos
MDV Médouneu
MDX Mercedes
MEF Melfi
MEJ Meadville
MEO Manteo
MEP Mersing
MET Moreton
MEV Minden
MEW Mweka
MEY Meghauli
MEZ Musina
MFB Monfort
MFC Mafeteng
MFF Moanda
MFI Marshfield
MFL Wando Vale
MFN Milford Sound
MFO Manguna
MFP Manners Creek
MFS Miraflores
MFV Melfa
MFX Les Allues
MFZ Demgulu
MGD Magdalena
MGI Matagorda Island
MGJ Montgomery (Estados Unidos)
MGK Mong Tong
MGP Manga Mission
MGR Moultrie (MGR)
MGS Mangaia Island
MGU Manaung
MGV Margaret River (MGV)
MGX Moabi
MGY Dayton (Wright Brothers)
MHA Mahdia
MHE Mitchell (Estados Unidos)
MHF Morichal
MHI Moucha Island
MHL Marshall (Misuri)
MHN Mullen
MHO Wunaamin Miliwundi Ranges (Mount House)
MHS Dunsmuir
MHW El Bañado
MHY Morehead
MIC Minneapolis (Crystal)
MIF Monahans
MIH Mitchell Plateau
MIN Minnipa
MIO Miami (Estados Unidos)
MIP Mitzpe Ramon
MIQ Omaha (Millard)
MIT Shafter
MIW Marshalltown
MIX Mirití-Paraná
MIY Mittebah
MIZ Mainoru
MJA Manja
MJB Mejit Atoll
MJG Mayajigua
MJJ Moki
MJO Mount Etjo Safari Lodge
MJP Manjimup
MJQ Jackson (Minnesota)
MJR Miramar
MJS Maganja
MJU Mamuju
MJW Gonarezhou National Park
MJX Toms River
MKB Mekambo
MKH Mokhotlong
MKI Mboki
MKJ Makoua
MKN Babase Island
MKO Muskogee
MKS Mekane Selam
MKT Mankato
MLD Malad City
MLF Milford
MLJ Milledgeville
MLK Malta (Estados Unidos)
MLP Malabang
MLQ Malalaua
MLR Millicent
MLT Millinocket
MLV Merluna
MLZ Melo
MMC Ciudad Mante
MMF Mamfe
MMI Athens (Tennessee)
MML Marshall (Minnesota)
MMM Middlemount
MMN Stow
MMP Santa Cruz de Mompóx
MMQ Mbala
MMS Marks
MMV Mal Island
MNA Karakelong Island
MNB Muanda
MND Medina (Colombia)
MNE Mungeranie
MNK Maiana
MNM Menominee
MNN Marion (Ohio)
MNO Manono
MNP Hermit Islands
MNQ Monto
MNS Mansa
MNV Mount Valley
MNW Macdonald Downs
MOK Muynak
MOM Moudjeria
MOO Moomba
MOP Mount Pleasant (Míchigan)
MOR Morristown (Tennessee)
MOS Elim (Moses Point)
MOX Morris
MOY Monterrey (Colombia)
MPD Sindhri
MPF Mapoda
MPG Makini
MPI Mamitupu (MPI)
MPJ Morrilton
MPO Mount Pocono
MPP Mulatupo
MPR Mc Pherson
MPS Mount Pleasant (Texas)
MPT Maliana
MPU Tatau Island
MPX Miyanmin
MPZ Mount Pleasant (Iowa)
MQA Eighty Mile Beach (Mandora)
MQB Macomb
MQD Maquinchao
MQE Marqua
MQG Midgard
MQK San Matías
MQO Malam
MQR Mosquera
MQV Sayada
MQW Mc Rae
MQZ Margaret River (MQZ)
MRC Columbia (Tennessee)
MRF Marfa
MRH May River
MRK Marco Island
MRM Manari
MRN Morganton
MRP Marla
MRT Moroak
MSC Mesa (Falcon)
MSF Mount Swan
MSG Matsaile
MSI Masalembo Island
MSK Puerto Gaitán
MSM Masi Manimba
MSV Monticello (Nueva York)
MSX Mossendjo
MTA Matamata Glider
MTB Montelíbano
MTD Mount Sanford Station
MTE Monte Alegre
MTG Vila Bela Da Santíssima Trindade
MTI Vila do Mosteiros
MTK Makin Island
MTL Maitland
MTO Mattoon
MTQ Mitchell (Australia)
MTU Montepuez
MTV Ablow
MTW Manitowoc
MTX Fairbanks (Metro)
MUG Mulegé (MUG)
MUJ Omo National Park
MUL Moultrie (Spence)
MUM Muli
MUP Mulga Park
MUQ Muccan Station
MUS Ogasawara (JMSDF Minami Torishima)
MUT Muscatine
MUU Maraú (Brasil)
MUY Mouyondzi
MVC Monroeville
MVE Montevideo (Estados Unidos)
MVK Mulka
MVL Morrisville
MVM Kayenta
MVN Mount Vernon
MVO Mongo
MVS Mucuri
MVU Musgrave
MVV Megève
MVW Burlington (Washington)
MVX Minvoul
MWB Morawa
MWC Milwaukee (Lawrence J Timmerman)
MWF Maewo Island
MWG Marawaka
MWI Maramuni
MWJ Matthews Ridge
MWK Palmatak
MWM Windom
MWN Mwadui
MWO Middletown
MWR Motswari Private Game Reserve
MWS Morowali (Indonesia Industrial Park)
MWT Moolawatana Station
MWU Mussau Island
MWV Sen Monorom
MWY Miranda Downs
MXA Manila (Estados Unidos)
MXB Masamba
MXC Monticello (Utah)
MXD Marion Downs
MXE Maxton
MXK Mindik
MXO Monticello (Iowa)
MXQ Cairu (Lorenzo)
MXR Myrhorod
MXS Maota
MXT Maintirano
MXU Mullewa
MXY Mccarthy
MYB Mayumba
MYF San Diego (Montgomery-Gibbs Executive)
MYH Marble Canyon
MYM Monkey Mountain
MYN Marib
MYO Myroodan Station
MYS Moyale (MYS)
MYX Menyamya
MYZ Monkey Bay
MZA Mazamari
MZC Mitzic
MZD Santiago de Méndez
MZE Spanish Lookout (Manatee)
MZJ Marana (Pinal Airpark)
MZK Marakei
MZN Minj
MZP Motueka
MZY Mossel Bay
MZZ Marion (Indiana)
NAC Naracoorte
NAD Macanal
NAE Natitingou
NAF Banaina-Borneo Island
NAI Annai
NAR Armenia (Colombia)
NAY Beijing (Nanyuan)
NAZ Star Harbor
NBA Nambaiyufa
NBB Barranco Minas
NBH Nambucca Heads
NBL San Blas
NCG Nuevo Casas Grandes
NCH Nachingwea
NCI Necocli
NCJ Sunchales
NCR San Carlos (Nicaragua)
NCT Nicoya (Guanacaste)
NDA Bandanaira
NDE Mandera
NDF N'dalatando
NDI Namudi
NDK Namorik Atoll
NDL N'Délé
NDM Mendi (Etiopía)
NDN Nadunumu
NDS Sandstone
NEG Negril
NEI Terney
NEJ Nejo
NEK Nekemte
NEN Jacksonville (Whitehouse Naval Outlying, Florida)
NFO Angaha
NFR Nafurah 1
NGD Anegada
NGL Ngala
NGW Corpus Christi (Cabaniss Naval Outlying Landing)
NGX Ngawal
NHF New Halfa
NHX Foley
NIA Nimba
NIF Camp Nifty
NIG Nikunau
NIK Niokolo-Koba National Park
NIN Ninilchik
NIO Nioki
NIR Beeville
NIS Simberi Island
NIX Nioro du Sahel
NJJ Heihe (Nenjiang Melgen)
NKA Ntoum
NKB Noonkanbah
NKD Sinak
NKL N'Kolo-Fuma
NKN Gwarawon
NKO Ankokoambo
NKP Nukutepipi
NKU Nkaus
NKY Nkayi
NLE Niles
NLL Nullagine
NLN Kneeland
NLP Nelspruit
NLS Nicholson
NMG Isla del Rey
NML Fort McMurray (Mildred Lake)
NMN Namane
NMP Basalt
NMR Nappa Merrie
NMT Namtu
NND Nangade
NNI Namutoni
NNK Naknek
NNL Nondalton
NNU Nanuque
NNX Nunukan-Nunukan Island
NOK Nova Xavantina
NOM Nomad River
NON Nonouti
NOO Naoro Vilage
NOR Norðfjörður
NOT Novato
NPG Nipa
NPH Nephi
NPP Napperby
NPR Novo Progresso
NPU San Pedro de Urabá
NPY Mpanda
NQL Niquelândia
NRE Namrole
NRG Narrogin
NRI Afton (Oklahoma)
NRM Keibane
NRS Imperial Beach
NRY Newry
NSL Slayton
NSM Norseman
NSO Scone
NSR São Raimundo Nonato
NSV Noosa
NTC Santa Carolina
NTI Bintuni
NTJ Manti
NUB Numbulwar
NUD En Nahud
NUG Nuguria Island
NUH Nunchia
NUK Nukutavake
NUR Nullabor Motel
NVD Nevada
NVM Nova Mutum
NVN Beckwourth
NVP Novo Aripuanã
NVY Neyveli
NWH Newport (Nuevo Hampshire)
NWT Nowata
NYE Nyeri
NYN Nyngan
NYR Nyurba
NYW Monywar
NZA Nzagi
NZE Nzérékoré
OAA Baraki Barak
OAH Shindand
OAN Olanchito
OAR Marina
OAS Sharana
OAZ Lashkar Gah (Camp Shorabak)
OBA Oban (Australia)
OBC Obock
OBD Obano
OBE Okeechobee
OBI Óbidos
OBL Zoersel
OBM Morobe
OCF Ocala
OCH Nacogdoches
OCM Boolgeeda
OCW Washington (Carolina del Norte)
ODA Ouadda
ODC Oakdale
ODD Oodnadatta
ODJ Ouanda Djallé
ODL Cordillo Downs
ODM Accident
ODR Ord River
ODT Odessa
ODW Oak Harbor (AJ Eisenberg)
OEA Lawrenceville (O'Neal, Illinois)
OEM Paloemeu
OEO Osceola
OFI Ouango Fitini
OGA Ogallala
OGE Ogeranang
OGM Ustupu (Ogobsucum)
OGO Abengourou
OGR Bongor
OHB Moramanga
OHH Okha
OHI Oshakati
OHR Wyk auf Föhr
OHT Kohat
OIA Ourilândia do Norte
OIC Norwich (Estados Unidos)
OJC Olathe
OKB Orchid Beach
OKF Okaukuejo
OKG Okoyo
OKK Kokomo
OKM Okmulgee
OKP Oksapmin
OKQ Okaba
OKS Oshkosh (Nebraska)
OKT Kzyl-Yar
OKU Mokuti Lodge
OKV Okao
OLC São Paulo De Olivença
OLD Old Town
OLE Olean
OLG Mara
OLI Rif
OLK Fuerte Olimpo
OLN Sarmiento
OLO Olomouc
OLQ Olsobip
OLR Khost (Salerno)
OLV Olive Branch
OLX Serena
OLY Olney-Noble
OMF Mafraq
OMG Omega
OMI Omidiyeh (OMI)
OMJ Nagasaki (JMSDF Omura)
OMK Omak
OMM Marmul
OMY Tbeng Meanchey
ONA Winona
ONB Onange Mission
ONH Oneonta
ONI Moanamani
ONK Olenyok
ONL O'Neill
ONM Socorro
ONR Monkira
ONS Onslow
ONU Ono-i-Lau
ONY Olney
OOA Cedar
OOD Koodaideri Mine
OOR Mooraberree
OOT Onotoa
OPA Kópasker
OPB Maitanakunai
OPI Oenpelli
OPL Opelousas
OPW Opuwa
OQN Kokand
ORC Orocue
ORE Saint-Denis-de-l'Hôtel
ORJ Orinduik
ORM Northampton
ORO Yoro
ORP Orapa
ORR Yorketown
ORW Ormara Raik
ORX Oriximiná (ORX)
OSB Osage Beach
OSC Oscoda
OSE Omora
OSG Ossima
OSJ Mara Simba
OSK Oskarshamn
OSO Osborne Mine
OSX Kosciusko
OTC Bol
OTG Worthington
OTJ Otjiwarongo
OTK Tillamook
OTL Boutilimit
OTN Oaktown
OTO Wulan
OTQ Otog Front Banner
OTT Cotriguaçu
OTU Remedios
OUG Ouahigouya
OUM Oum Hadjer
OUN Norman
OUR Batouri
OUS Ourinhos
OUT Bousso
OVA Bekily
OVE Oroville
OVG Overberg
OVL Ovalle
OVR Olavarria
OWA Owatonna
OWK Norridgewock
OXC Oxford (Connecticut)
OXD Oxford (Ohio)
OXO Orientos
OXY Morney
OYC Camopi
OYG Moyo
OYL Moyale (OYL)
OYN Ouyen
OZA Ozona
PAA Hpa-N
PAF Pakuba
PAJ Parachinar
PAK Hanapepe
PAU Pauk
PAW Pambwa Station
PAY Pamol
PBA Cairu (Fábio Perini)
PBB Paranaíba
PBE Puerto Berrio
PBP Nandayure
PBQ Pimenta Bueno
PBT Puerto Leda
PBX Porto Alegre do Norte
PCA Portage Creek
PCB Jakarta (Pondok Cabe)
PCC Puerto Rico (Colombia)
PCD Prairie Du Chien
PCG Paso Caballos
PCH Palacios (Honduras)
PCJ Puerto La Victoria
PCM Playa del Carmen
PCO La Ribera
PCQ Phongsaly
PCS Picos
PCT Princeton (Nueva Jersey)
PCU Poplarville
PCV Mulegé (Punta Chivato)
PDC Népoui
PDD Ponta do Ouro
PDE Pandie Pandie
PDF Prado
PDI Pindiu
PDN Kangaroo Island
PDR Presidente Dutra
PDZ Capure
PEA Ironstone
PEB Pebane
PEF Peenemünde
PEL Pelaneng
PEP Peppimenarti
PEQ Pecos
PEY Penong
PFA Harbin (Pingfang)
PFC Pacific City
PFM Primrose
PGB Pangoa
PGC Petersburg (Virginia Occidental)
PGE Yegepa
PGI Chitato (PGI)
PGL Pascagoula
PGN Pangia
PGO Pagosa Springs
PGQ Pekaulang
PGR Paragould
PGS Peach Springs (Grand Canyon Caverns)
PHA Phan Rang
PHD New Philadelphia
PHI Pinheiro
PHK Pahokee
PHN Port Huron
PHP Philip
PHQ Phosphate Hill
PHR Nanuku Auberge Resort
PHT Paris (Tennessee)
PIC Pine Cay
PIM Pine Mountain
PIN Parintins
PIQ Pipillipai
PIV Pirapora
PJB Payson
PKD Park Rapids
PKF Park Falls
PKJ Playa Grande
PKK Pakhokku
PKM Port Kaituma
PKO Parakou
PLA Planadas
PLD Carrillo
PLE Paiela
PLF Pala
PLK Branson (M. Graham Clark Downtown)
PLR Pell City
PLT Plato
PLY Plymouth (Indiana)
PMB Pembina
PMH Portsmouth (Estados Unidos)
PML Cold Bay (Port Moller)
PMN Pumani
PMP Pimaga
PMT Paramakatoi
PNG Paranaguá
PNJ Yantai (Penglai Shahekou)
PNN Princeton (Maine)
PNU Panguitch
POC La Verne
POD Podor
POF Poplar Bluff
POH Pocahontas
POJ Patos de Minas
PON Poptún
POV Prešov
POY Powell
PPA Pampa
PPC Prospect Creek
PPF Parsons
PPH Paraitepuy de Ikabarú
PPJ Jakarta (Pulau Panjang)
PPL Phaplu
PPM Pompano Beach
PPR Pasir Pengarayan
PPU Pa Pun
PPX Nepesi
PPY Pouso Alegre
PPZ Puerto Paez
PQM Palenque
PRD Pardoo
PRE Pore
PRK Prieska
PRO Perry (Iowa)
PRP Propriano
PRQ Presidencia Roque Sáenz Peña
PRR Paruima
PRS Parasi
PRU Pye
PRW Prentice
PRZ Prineville
PSB Philipsburg
PSF Pittsfield
PSH Sankt Peter-Ording
PSK Dublin (Virginia)
PSL Perth (Reino Unido)
PSN Palestine
PSW Passos
PSX Palacios (Estados Unidos)
PTB Petersburg (Virginia)
PTL Máncora
PTN Patterson
PTQ Porto de Moz
PTS Pittsburg
PTT Pratt
PTV Porterville
PTW Pottstown
PTZ Shell Mera
PUA Puas Mission
PUC Price
PUE Puerto Obaldía
PUK Pukaruha
PUN Punia
PUP Po
PUV Malabou
PUX Puerto Varas
PVC Provincetown
PVF Placerville
PVI Paranavaí
PVL Pikeville
PVW Plainview
PWA Oklahoma City (Wiley Post)
PWD Plentywood
PWI Pawe
PWL Purwokerto-Java Island
PWN Pitts Town
PWO Pweto
PXA Bentayan
PXL Polacca
PYA Puerto Boyacá
PYB Jeypore
PYC Ukupseni
PYE Penrhyn Island
PYG Pakyong
PYM Plymouth (Massachusetts)
PYN Payán
PYO Puerto Putumayo
PYS Paradise
PYV Yaviza
PYY Pai
PZK Pukapuka Atoll
PZL Phinda
PZR Bajo Baudó
QCH Colatina
QCP Currais Novos
QDB Cachoeira Do Sul
QDV Jundiaí
QGF Montenegro
QGP Garanhuns
QHU Husum
QHV Novo Hamburgo
QIG Iguatu
QIT Itapetinga
QJP Pocheon
QRF Bragado
QSC São Carlos
QSI Moshi
QSX New Amsterdam
QUB Ubari
QUG Chichester
QUY St Ives
RAA Rakanda
RAC Racine
RAF Rafaela
RAG Raglan
RAN Ravenna
RAQ Raha
RAV Cravo Norte
RAW Arawa
RAX Oram
RBC Robinvale
RBD Dallas (Executive)
RBF Big Bear
RBG Roseburg
RBI Rabi Island
RBJ Rebun
RBK Murrieta
RBM Atting
RBO Roboré
RBP Rabaraba
RBS Orbost
RBT Marsabit
RBU Roebourne
RBW Walterboro
RBX Rumbek
RBZ Shahrisabz
RCK Rockdale
RCL Redcliffe
RCR Rochester (Indiana)
RCS Rochester (Reino Unido)
RCY Port Nelson
RDA Rockhampton Downs
RDB Red Dog
RDC Redenção
RDE Merdei-Papua Island
RDN Redang
RDT Richard Toll
REB Lärz
RED Reedsville
REE Lubbock (Reese Airpark)
REI Régina (Guayana Francesa)
REO Rome (Oregón)
REQ Chagai
REY Reyes
REZ Resende
RFA Rafaï
RFG Refugio
RFK Rolling Fork
RFN Raufarhöfn
RFR Rio Frio
RFS La Rosita
RGH Balurghat
RGR Ranger
RHA Reykhólar
RHG Ruhengeri
RHL Roy Hill Station
RHN Rosh Pinah
RHP Ramechhap
RHV San José (Reid-Hillview of Santa Clara, Estados Unidos)
RID Richmond (Indiana)
RIE Rice Lake
RIF Richfield
RIG Rio Grande (Brasil)
RIM Rodriguez de Mendoza
RIN Ringi Cove
RIR Riverside (Flabob)
RJB Rajbiraj
RJI Rajouri
RKA Aratika Nord
RKH Rock Hill
RKP Rockport
RKR Poteau
RKU Yule Island
RKW Rockwood
RKY Rokeby
RLA Rolla
RLD Richland
RLO Merlo
RLP Rosella Plains
RLR Isalo
RLT Arlit
RMB Buraimi
RMD Ramagundam
RMN Rumginae
RMY Mariposa
RNA Arona
RNC Mc Minnville
RNM Ghaba
RNT Renton
RNU Ranau
RNZ Rensselaer
ROF Montague (Yreka Rohrer)
ROG Rogers
ROH Robinhood
ROL Roosevelt
RON Paipa
ROU Shtraklevo
ROX Roseau
ROY Rio Mayo
RPA Rolpa
RPB Roper Bar
RPU Urucu
RPV Roper Valley
RPX Roundup
RQO El Reno
RRL Merrill
RRM Marromeu
RRT Warroad
RRV Robinson River
RSB Roseberth
RSK Ransiki-Papua Island
RSN Ruston
RSS Ad Damazin
RTL Okoboji
RTN Raton
RTO Tangerang-Java Island
RTP Yagoonya
RTS Rottnest Island
RTU Maratua
RTY Merty Merty
RUD Shahrud
RUE Butembo
RUF Amgotro
RUK Rukumkot
RUM Rumjatar
RUP Rupsi
RUU Kawbenaberi
RUY Copán Ruinas
RVA Farafangana
RVC River Cess
RVD Rio Verde
RVO Reivilo
RVR Green River (Estados Unidos)
RVT Ravensthorpe
RXA Ar Rawdah
RXE Rexburg
RYL Lower Zambezi River
RZH Preobrazheniye
RZP Taytay
RZS Sawan Gas Field
SAA Saratoga
SAD Safford
SAK Sauðárkrókur
SAM Salamo
SAR Sparta (Illinois)
SAS Salton City
SAU Sabu-Sawu Island
SAX Boca de Sábalo
SAZ Sasstown
SBB Santa Bárbara (Venezuela)
SBC Selbang
SBE Suabi
SBF Sardeh Band
SBG Sabang
SBI Koundara
SBJ São Mateus
SBM Sheboygan
SBO Salina (Estados Unidos)
SBQ Sibi
SBS Steamboat Springs (Bob Adams)
SBV Sabah
SBX Shelby
SCA Santa Catalina
SCB Scribner
SCD Sulaco
SCF Scottsdale
SCG Spring Creek
SCP Saint-Crépin
SCX Salina Cruz
SDC Sand Creek
SDI Saidor
SDX Sedona
SEE San Diego (Gillespie)
SEF Sebring
SEG Selinsgrove
SEH Senggeh
SEM Selma
SEO Séguéla
SEP Stephenville
SEQ Bengkalis-Sumatra Island
SER Seymour
SEW Siwa Oasis
SEY Sélibaby
SFH Mexicali (San Felipe)
SFK Soure
SFM Sanford
SFU Safia
SFV Santa Fé do Sul
SFX Ciudad Guayana
SFZ Pawtucket
SGA Shiveh
SGK Sengapi
SGM Mulegé (San Ignacio)
SGP Shay Gap
SGQ Sanggata
SGT Stuttgart (Estados Unidos)
SGV Sierra Grande
SGX Songea
SHK Sehonghong
SHN Shelton
SHQ Southport
SHU Smith Point
SHX Shageluk
SHZ Seshutes
SIB Sibiti
SIC Las Perlas
SIK Sikeston
SIL Sila Mission
SIM Simbai
SIQ Pasirkuning-Singkep Island
SIU Siuna
SIV Sullivan
SIW Parapat-Sumatra Island
SIX Singleton
SIY Montague (Siskiyou)
SIZ Sissano
SJA San Juan de Marcona
SJB San Joaquín
SJH San Juan Del César
SJN St Johns
SJQ Sesheke
SJR San Juan De Uraba
SJS San José de Chiquitos
SJV San Javier
SKC Suki
SKJ Singkawang
SKL Ashaig
SKM Skeldon
SKQ Sekakes
SKR Shakiso
SKW Skwentna
SLB Storm Lake
SLF As-Sulayyil
SLG Siloam Springs
SLJ Karijini National Park
SLO Salem (Estados Unidos)
SLR Sulphur Springs
SLT Salida
SLV Jubbarhatti
SMB Cerro Sombrero
SMD Fort Wayne (Smith)
SMH Sapmanga
SMJ Sim
SMM Semporna
SMP Stockholm (Papúa Nueva Guinea)
SMU Sheep Mountain
SMY Simenti
SMZ Stoelmanseiland
SNG San Ignacio de Velasco
SNH Stanthorpe
SNK Snyder
SNL Shawnee
SNM San Ignacio de Moxos
SNQ San Quintín (Military)
SNT Sabana de Torres
SOA Sóc Trăng
SOE Souanke
SOH Solita
SOK Semonkong
SOL Solomon
SOP Carthage
SOR T2
SOX Sogamoso
SPA Spartanburg
SPE Sepulot
SPF Spearfish
SPG St Petersburg
SPH Sopu
SPJ Sparti
SPT Sipitang
SPV Sepik Plains
SPW Spencer
SPZ Springdale
SQA Santa Ynez
SQB Piedras
SQC Southern Cross
SQE San Luis De Palenque
SQF Solano
SQH Mai Son
SQI Rock Falls
SQK Sidi El Barrani
SQM São Miguel do Araguaia
SQN Sanana
SQR Soroako
SQS Spanish Lookout (Matthew Spain)
SQT Samarai Island
SQU Plaza Saposoa
SQV Sequim
SQX São Miguel do Oeste
SQY São Lourenço Do Sul
SRB Santa Rosa (Bolivia)
SRC Searcy
SRD San Ramón
SRH Sarh
SRJ San Borja
SRM Sandringham Station
SRN Strahan
SRO Santana Ramos
SRR North Stradbroke Island
SRS San Marcos
SRU Falam
SRW Salisbury (Estados Unidos)
SSD San Felipe (Chile)
SSK Sturt Creek
SSL Santa Rosalia
SSO São Lourenço
SSP Silver Plains
SSQ La Sarre
SSS Siassi
SSX Singita Safari Lodge
STE Stevens Point
STH Strathmore
STK Sterling
STQ St Marys
STU Santa Cruz (Belice)
SUA Stuart
SUD Stroud
SUE Sturgeon Bay
SUM Sumter (SUM)
SUO Sunriver
SUP Sumenep
SUQ Sucúa
SUT Sumbawanga
SUW Superior
SVE Susanville
SVF Savé
SVH Statesville
SVK Silver Creek
SVT Savuti
SVV San Salvador de Paul
SWB Shaw River
SWE Siwea
SWG Satwag
SWJ Malekula Island
SWN Sherpur Naqeebpur
SWP Swakopmund
SWR Silur Mission
SWW Sweetwater
SWY Sitiawan
SXA Sialum
SXG Senanga
SXH Sehulea
SXO São Félix Do Araguaia
SXS Sahabat
SXT Taman Negara
SXU Soddu
SXW Sauren
SXX São Félix do Xingu
SXY Sidney (Nueva York)
SYC Shiringayoc
SYE Sa'dah
SYH Namche Bazaar
SYI Shelbyville
SYK Stykkishólmur
SYN Dennison
SYV Sylvester
SZM Sesriem
SZN Santa Cruz Island
SZP Santa Paula
SZS Oban (Nueva Zelanda)
TAD Trinidad (Estados Unidos)
TAJ Aitape (Tadji)
TAN Tangalooma
TAQ Tarcoola
TAU Tauramena
TAW Tacuarembo
TAX Tikong-Taliabu Island
TBC Tuba City
TBD Timbiqui
TBE Timbunke
TBK Timber Creek
TBL Tableland Homestead
TBQ Tarabo
TBR Statesboro
TBV Tabal Island
TBX Tambelan
TBY Tshabong
TCF Tocoa
TCH Tchibanga
TCJ Torembi
TCK Tinboli
TCN Tehuacán
TCU Homeward
TCW Tocumwal
TCY Terrace Bay
TDA Trinidad (Colombia)
TDB Tetebedi
TDJ Tadjoura
TDN Drysdale River (Theda Station)
TDO Toledo (Washington)
TDP Corrientes (Perú)
TDR Theodore
TDT Timbavati
TDV Tanandava
TDW Amarillo (Tradewind)
TDZ Toledo (Executive, Ohio)
TEG Tenkodogo
TEH Tetlin
TEI Tezu
TEL Telupid
TEO Terapo Mission
TEP Teptep
TES Tessenei
TEY Þingeyri
TFB Tifalmin
TFL Teófilo Otoni
TFM Telefomin
TFT Taftan
TFY Krui
TGB Rizal
TGC Belawai
TGI Tingo Maria
TGL Sudest Island
TGS Chokwé
THA Tullahoma
THB Thaba-Tseka
THC Zwedru
THI Tichitt
THK Thakhek
THM Thompson Falls
THP Thermopolis
THT Tamchakett
THV Thomasville (Pensilvania)
THY Thohoyandou
TIB Tibú
TIC Arno Atoll (Tinak)
TII Tarinkot
TIL Cheadle
TIO Tilin
TIY Tidjikja
TJB Tanjung Balai-Karinmunbesar Island
TJC Ticantiquí
TJN Takume
TJV Thanjavur
TKB Tekadu
TKO Tlokoeng
TKR Thakurgaon
TKW Tekin
TKY Turkey Creek
TKZ Tokoroa
TLB Tarbela
TLD Tuli Lodge
TLF Telida
TLK Talakan Oil Field
TLO Tol
TLP Tumolbil
TLR Tulare
TLW Talasea
TLZ Catalão
TMA Tifton
TMD Timbedra
TMN Tamana Island
TMQ Tambao
TMU Nicoya (Tambor)
TMY Tiom-Papua Island
TMZ Thames
TNB Tanah Grogot
TNI Satna
TNL Ternopil
TNM Villa Las Estrellas
TNO Tamarindo
TNP Twentynine Palms
TNQ Teraina
TNS Tungsten
TNT Miami (Dade Collier Training and Transition)
TNU Newton (Iowa)
TNV Tabuaeran Island
TNZ Tosontsengel
TOA Torrance
TOB Adam (Libia)
TOC Toccoa
TOH Loh
TOK Torokina
TON Tonu
TOO Coto Brus
TOR Torrington
TOT Totness
TOX Tobolsk (TOX)
TOZ Touba
TPF Tampa (Peter O Knight)
TPG Taiping
TPK Tapaktuan
TPN Tiputini
TPR Tom Price
TPT Tapeta
TPU Tikapur
TPX Tupai Atoll
TQL Tarko-Sale
TQN Taleqan
TQP Trepell
TQQ Waha-Tomea Island
TRH Trona
TRJ Tarakbits
TRL Terrell
TRX Trenton (Estados Unidos)
TRY Tororo
TSC Taisha
TSD Tshipise
TSG Tanacross
TSH Tshikapa
TSI Tsile Tsile
TSL Tamuín
TSP Tehachapi
TSQ Torres
TSU Tabiteuea South
TSW Tsewi
TSY Cibeureum
TSZ Tsetserleg
TTI Tetiaroa
TTM Tablón De Tamara
TTO Britton
TTQ Tortuguero
TTR Makale
TTX Anjo Peninsula
TUH Manchester (Tennessee)
TUJ Tum
TUQ Tougan
TUW Coetupo
TUX Tumbler Ridge
TUY Tulum (Base Aeronaval de)
TVA Morafenobe
TVI Thomasville (Georgia)
TWB Toowoomba (TWB)
TWD Port Townsend
TWE Taylor (Alaska)
TWP Torwood
TWY Tawa
TXF Teixeira de Freitas
TXM Atinjoe
TXR Tanbar Station
TXU Tabou
TYA Tula
TYC Taiyuan (Yaocheng)
TYD Tynda
TYE Tyonek
TYG Thylungra
TYP Tobermorey
TYT Treinta y Tres
TYZ Taylor (Arizona)
TZC Caro
TZM Tizimin
TZO Ankisatra
UAC San Luis Río Colorado
UAE Aue
UAL Luau
UAS Isiolo West
UAX Uaxactun
UBI Buin
UBS Columbus (Lowndes, Misisipi)
UBT Ubatuba
UBU Kalumburu
UCC Mercury (Yucca)
UCE Eunice
UCK Lutsk
UCN Buchanan
UCY Union City
UCZ Uchiza
UDA Undara
UDD Bermuda Dunes
UEE Queenstown (Australia)
UEN Urengoy
UES Waukesha
UGB Pilot Point (Ugashik Bay)
UGL Union Glacier
UGN Chicago (Waukegan National)
UGS Ugashik
UGT Khankhongor
UHS Aleksandrovsk-Sakhalinskiy
UIK Ust-Ilimsk
UIL Quillayute
UIR Quirindi
UJN Bongsan-ri
UJU Uiju
UKA Ukunda
UKH Mukhaizna Oil Field
UKN Waukon
UKR Mukayras
UKT Quakertown
UKU Nuku
ULB Ambrym Island
ULE Sule
ULI Falalop Island
ULM New Ulm
ULS Mulatos
ULX Ulusaba
UMA Maisí
UMC Umba
UMI Quince Mil
UMM Cantwell
UMR Woomera
UMT Umiat
UMY Sumy
UMZ Mena
UNC Unguía
UNE Qacha's Nek
UNR Öndörkhaan
UNU Juneau (Estados Unidos)
UOA Moruroa Atoll
UOS Sewanee
UPP Hawi
UPR Upiara
UPV Pewsey
URD Ebermannstadt
URI La Uribe
URM Urimán
URN Urgun
URR Urrao
URU Uroubi
URZ Orūzgān
USC Union
USI Mabaruma
USL Useless Loop
USS Sancti Spiritus
UTA Mutare
UTB Muttaburra
UTD Nutwood Downs
UTE Bultfontein
UTG Quthing
UTM Tunica
UTU Ustupu (UTU)
UUK Kuparuk
UUU Manumu
UVA Uvalde
UVL Kharja Oases
UVO Uvol
UWA Ware
UZM Hope Bay (UZM)
VAB Yavarate
VAC Cloppenburg
VAH Vallegrande
VAP Viña del Mar (Rodelillo)
VAT Vatomandry
VBA Aeng
VBC Mandalay (Chanmyathazi)
VBP Bokpyinn
VCC Vacaria
VCD Victoria River
VCF Valcheta
VCH Vichadero
VCV Victorville
VDA Eilat (Ovda)
VDI Vidalia
VDY Toranagallu
VEG Maikwak
VEV Barakoma
VEX Tioga
VGS General Villegas
VGZ Villa Garzón
VHN Van Horn
VHZ Vahitahi
VIA Videira
VIH Vichy
VIQ Viqueque
VIU Viru
VIV Vivigani
VJI Abingdon
VJQ Gurue
VKS Vicksburg
VLA Vandalia
VLE Grand Canyon (Valle)
VLP Vila Rica
VNA Salavan
VNC Venice
VND Vangaindrano
VNR Vanrook Station
VNT Ventspils
VOI Voinjama
VOT Votuporanga
VPG Kikambala
VRI Varandey
VRS Versailles
VRZ Lavras
VSF North Springfield
VTF Vatulele
VTG Vũng Tàu
VUU Liwonde National Park
VVB Mahanoro
VVK Västervik
VVN Las Malvinas
VYD Vryheid
VYS Peru (Illinois)
WAD Andriamena
WAF Waana
WAH Wahpeton
WAJ Wavoi Falls
WAK Ankazoabo
WAL Wallops Island
WAM Ambatondrazaka
WAO Wabo
WAP Palena
WAQ Antsalova
WAU Wauchope
WAV Wave Hill
WAX Zuwarah
WAY Waynesburg
WAZ Warwick
WBA Wahai
WBC Wapolu
WBD Befandriana
WBE Bealanana
WBK West Branch
WBO Beroroha
WBR Big Rapids
WBU Boulder
WBW Wilkes-Barre (Wyoming Valley)
WCA Castro
WCD Cundeelee
WCR Chandalar Lake
WDA Ain District
WDB Weda
WDG Enid (Woodring)
WDI Wondai
WDR Winder
WEA Weatherford
WED Wedau
WEL Welkom
WEP Weam
WET Tigi
WEW Wee Waa
WFK Frenchville
WGB Bahawalnagar
WGC Warangal
WGO Winchester
WHF Wadi Halfa
WHL Welshpool
WHO Franz Josef
WHP Pacoima
WHS Whalsay
WHT Wharton
WHU Wuhu (Wanli)
WIB Vernon (Estados Unidos)
WIK Waiheke Island
WIO Wilcannia
WIU Garove Island
WJA Woja
WKI Hwange
WKN Wakunai
WKR Walkers Cay
WLA Eighty Mile Beach (Wallal Downs)
WLC Walcha
WLD Winfield
WLE Miles
WLL Wollogorang
WLO Waterloo (Australia)
WLP West Angelas
WLU Puri
WLW Willows
WMA Mandritsara
WMB Warrnambool
WMD Mandabe
WML Malaimbandy
WMP Mampikony
WND Laverton (Windarra)
WNU Wanuma
WOA Wonenara
WOK Uonquén
WON Wondoola
WOT Wang'an
WOW Willow
WPA Puerto Aysén
WPB Port Bergé
WPK Wrotham Park
WPM Wipim
WPO Paonia
WRA Warder
WRH Orku
WRN Windarling Mine
WRW Warrawagine
WRZ Weerawila
WSA Wasua
WSF Cape Sarichef
WSG Washington (Pensilvania)
WSH Shirley
WSM Wiseman
WSO Washabo
WSP Waspam
WSR Wasior
WSU Wasu
WSY Shute Harbour
WTD West End
WTP Fatima Mission
WTR Whiteriver
WTS Tsiroanomandidy
WTT Wantoat
WTZ Whitianga
WUD Wudinna
WUG Wau (Papúa Nueva Guinea)
WUI Murrin Murrin
WUM Wasum
WUV Wuvulu Island
WVI Watsonville
WVL Waterville
WVN Wilhelmshaven
WWI Woodie Woodie
WYN Wyndham
WZA Wa
WZQ Urad Middle Banner
XAL Álamos
XAR Aribinda
XAU Saül
XBG Bogande
XBN Biniguni
XBO Boulsa
XBR Brockville
XCL Cluff Lake
XCM Chatham-Kent
XCO Colac Otway Shire
XDE Diebougou
XDJ Djibo
XES Lake Geneva
XFT Big Pine Key
XGA Gaoua
XGG Gorom-Gorom
XIE Xienglom
XIG Xinguara
XIN Meizhou (Xingning)
XKA Kantchari
XKY Kaya
XLU Leo
XMA Maramag
XMC Mallacoota
XMD Madison (Dakota del Sur)
XMG Mahendranagar
XMI Masasi
XML Minlaton
XMP Macmillan Pass
XNT Xingtai
XNU Nouna
XPA Pama
XPP Poplar River
XPR Pine Ridge
XRQ New Barag Right Banner
XSD Tonopah (Test Range)
XSE Sebba
XSO Siocon
XTO Taroom
XTR Tara
XYE Ye
XYR Yellow River Mission
XZA Zabré
YAE Yartsevo
YAN Yangambi
YAR La Grande-3
YAU Kattiniq
YBA Banff
YBO Bob Quinn Lake
YBS Opapimiskan Lake
YCA Courtenay
YCT Coronation
YCW Chilliwack
YCZ Fairmont Hot Springs
YDC Drayton Valley
YDJ Hatchet Lake
YDU Kasba Lake
YDW Obre Lake
YEB Echo Bay
YEH Yinchuan (Yueyahu)
YEQ Yenkis
YEU Eureka (Canadá)
YFG Fontanges
YFI Suncor Energy Site
YGA Chongqing (Yongchuan Da'an General)
YGB Texada
YHB Hudson Bay
YHE Hope
YHJ Nanchang (Yaohu)
YHS Sechelt
YJA Jasper (Canadá)
YJP Hinton
YJS Samjiyŏn
YKC Collins Bay
YKE Knee Lake
YLB Lac La Biche
YLG Yalgoo
YLP Longue-Pointe-de-Mingan
YLQ La Tuque
YLS Lebel-sur-Quévillon
YLV Yevlakh
YMB Merritt
YMK Mys Kamennyi
YMV Mary River
YMW Messines
YNH Hudson's Hope
YNX Snap Lake Mine
YOE Donnelly
YOI Éléonore Mine
YPB Port Alberni
YPD Parry Sound
YRD Kimsquit Valley
YRM Rocky Mountain House
YRR Big Bay
YSA Sable Island
YSE Squamish
YSV Saglek
YTT Tisdale
YUB Tuktoyaktuk
YUE Yuendumu
YUK Kapan
YVD Yeva
YVG Vermilion
YVT Buffalo Narrows
YYM Cowley
ZAC York Landing
ZBE Dolní Benešov
ZBL Biloela (ZBL)
ZBO Bowen
ZBY Sainyabuli
ZEG Senggo-Papua Island
ZEN Zenag
ZFW Fairview
ZGL South Galway
ZGM Ngoma
ZGR Little Grand Rapids
ZHM Shamshernagar
ZHP High Prairie
ZIS Zintan
ZKB Kasaba Bay
ZKG Côte-Nord-du-Golfe-du-Saint-Laurent
ZKL Zigong
ZLR Linares
ZLX Zalingei
ZMD Sena Madureira
ZMH 108 Mile
ZMM Zamora
ZNC Nyac
ZPH Zephyrhills
ZPO Pinehouse Lake
ZQW Zweibrücken
ZRM Sarmi
ZSS Sassandra
ZTA Tureia
ZUD Ancud
ZUL Zilfi
ZVG Springvale (Australia Occidental)
ZZE Zangilan
ZZO Tymovskoye
AFK Ampara (Kondavattavana Tank Seaplane Base)
AYM Abu Dhabi (Yas Island Seaplane Base)
AYY Pottuvil
BNF Baranof
BNH Boston (Cape Air Seaplanes on Harbor Seaplane Base)
BQV Gustavus (Bartlett Cove Seaplane Base)
BXL Nanuya Lailai Island
BYV Colombo (Beira Lake Seaplane Base)
CST Castaway Island
CZP Cape Pole
DBK Kalpitiya Island
DBU Dambulla
DGM Colombo (Dandugama Seaplane Base)
DIW Dickwella
DST Dubai Seaplane Terminal
ELW Ellamar
FAK False Island
GDH Golden Horn Lodge
HBH Entrance Island
HWI Hawk Inlet
IRU Iranamadu
JBT Bethel (Seaplane Base)
KBE Bell Island
KBW Chignik (Bay Seaplane Base)
KCN Chernofski Harbor
KDW Kandy (Victoria Reservoir Seaplane Base)
KEZ Colombo (Kelani-Peliyagoda Seaplane Base)
KIB Ivanof Bay
KKL Karluk Lake
KTH Tikchik
KVU Korolevu
KWF Waterfall
MPB Miami (Seaplane Base)
MSB Saint Martin
NUA Nuwara Eliya
NUF Hatton
PSQ Essington
PTC Port Alice
PUL Poulsbo
PWR Port Walter
PYL Perry Island
RAD Tortola (Road Town Seaplane Base)
RSE Sydney (Rose Bay Seaplane Base, Australia)
RSX Rouses Point
SGW Saginaw Bay
SJF Cruz Bay
STF Stephens Island
THW Trincomalee (Harbor Waterdrome)
TKI Tokeen
TKL Taku Lodge
TOV Tortola (West End Seaplane Base)
TTL Nanuya Levu Island
TWH Two Harbors
WLR Loring
WMK Meyers Chuck
WSB Steamboat Bay
WYB Yes Bay
XBB Blubber Bay
YBH Bull Harbour
YBJ Baie-Johan-Beetz
YCF Cortes Bay
YFL Fort Reliance
YGE Gorge Harbour
YHC Hecate Island
YKK Kitkatla
YKT Klemtu
YMU Mansons Landing
YPT Sunshine Coast (Canadá)
YQJ Quadra Island
YRC Desolation Sound
YRN Rivers Inlet
YSI Frying Pan Island
YSX Bella Bella (Shearwater Seaplane Base)
YTB Hartley Bay
YWQ Chutes-des-Passes
YWR White River
ZGN Zhongshan
ZNU Namu
ZOF Ocean Falls
ZQS Queen Charlotte
ZSW Prince Rupert (Seal Cove Seaplane Base)
ZTS Tahsis
ALV Escaldes-Engordany
ANT Sankt Anton am Arlberg
CBA West Kelowna
CCD Los Angeles (Century City Heliport)
DDI Whitsundays
EMR El Mirador
FGL Fox
GFA Great Falls (Malmstrom Air Force Base)
GNE Gent
HAE Supai Village
HAP Long Island (Australia)
HEN Helsinki (Hernesaari Heliport)
HEY Fort Rucker Ozark (Hanchey Army Heliport)
HGT Jolon
HIW Hiroshima (Heliport)
HLR Fort Cavazos
HPR Pretoria (Central Heliport)
ILH Illesheim
JAH Aubagne
JCJ Chuja
JCO Comino
JFM Fremantle
JID City of Industry
JPN Washington DC
JRB New York (Downtown Skyport Heliport)
JRK Arsuk
KAH Melbourne (Heliport, Batman Park, Australia)
KHQ Kullorsuaq
LOR Fort Rucker Ozark (Lowe AHP Heliport)
MDA San Antonio (Martindale Army Heliport)
MHB Auckland City
NSQ Nuussuaq
PQD Batticaloa (Passikudah Helipad)
SOI South Molle Island Resort
SPQ San Pedro (Estados Unidos)
SYL Camp Roberts
TLG Tulaghi Island
TRB Turbo
WKL Waikoloa Village
XZM Sé
YSD Ralston
YWA Petawawa
ZDM Ramallah
ZFU Arujá
ZIZ Zamzama Gas Field
ZOE Ludwigshafen am Rhein`;
