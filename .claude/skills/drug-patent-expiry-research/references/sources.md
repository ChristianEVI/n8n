# Quellen, URL-Muster und Zugangswege

## Inhalt
1. Zulassung und regulatorische Exklusivität
2. Patente und Verlängerungen
3. Aussagen des Originators
4. Pipeline, Angriffe, Settlements
5. Aggregatoren (nur Hinweise)
6. Wenn direkte Abrufe blockiert sind

## 1. Zulassung und regulatorische Exklusivität

| Was | Wo | Hinweis |
|---|---|---|
| FDA-Zulassungsdatum, Letters | https://www.accessdata.fda.gov/drugsatfda_docs/appletter/JAHR/BLA-NUMMER... | Approval Letter nennt PREA-Auflagen; "fulfilled PREA requirement" ist keine pädiatrische Exklusivität |
| Purple Book (Biologika) | https://purplebooksearch.fda.gov/index.cfm?blaNo=BLA&event=productdetails | Exklusivitätsende nur bei FDA-Festlegung; Patente nur nach "patent dance"; monatlicher CSV-Download |
| Orange Book (Small Molecules) | https://www.accessdata.fda.gov/scripts/cder/ob/ | Patente, Exklusivitätscodes, Paragraph-IV-Liste separat |
| Pädiatrische Exklusivität USA | https://www.fda.gov/drugs/development-resources/pediatric-exclusivity-granted | XLSX-Liste aller Written-Request-Exklusivitäten |
| EMA EPAR | https://www.ema.europa.eu/en/medicines/human/EPAR/PRODUKT | "Marketing authorisation issued", EU-Nummer, Assessment Reports aller Variationen |
| EU Union Register | https://ec.europa.eu/health/documents/community-register/html/hNNNN.htm | Entscheidungs- und Notifizierungsdaten (JS-lastig, ggf. nicht extrahierbar) |
| SmPC (EU) | Annex I der Kommissionsentscheidung im Union Register | "Date of first authorisation" |

## 2. Patente und Verlängerungen

| Was | Wo | Hinweis |
|---|---|---|
| PTE-Antrag und Patente | Federal Register, Suche "Determination of Regulatory Review Period for Purposes of Patent Extension MARKE" | Nennt Patentnummern, Antragsteller, Testphase, beantragte Tage |
| PTE-Zertifikate | USPTO-Liste "Patent terms extended under 35 USC 156" | Endgültige Tage |
| Patentdaten | https://patents.google.com/patent/NUMMER/en | "Adjusted expiration" enthält PTA/PTE; WO-A1-Seite listet Familie mit Nummern inkl. SPCs |
| EP-Register, INPADOC | https://register.epo.org/application?number=EP+Anmeldenummer | Legal-Status-Tab zeigt SPC-Ereignisse (SPCF, SPCG) mit Ablaufdaten; aus manchen Umgebungen nicht erreichbar |
| Espacenet | https://worldwide.espacenet.com | Familie, SPC-PDFs für BE, LU, NL |
| Nationale SPC-Register | DPMAregister (DE), INPI (FR), UK IPO SPC-Suche https://www.ipo.gov.uk/types/patent/p-os/p-find/p-find-spc.htm, IPOI https://eregister.ipoi.gov.ie/Query/SPQuery.aspx (IE), PRV (SE), Octrooicentrum NL | Maßgeblich für taggenaue Ablaufdaten je Land |
| Health Canada CSP-Register | https://www.canada.ca/en/health-canada/services/drugs-health-products/drug-products/applications-submissions/guidance-documents/register-certificates.html | Guter Querverweis für Anmeldedatum und Patentfamilie (CSP endet 2 Jahre nach Patentablauf) |

## 3. Aussagen des Originators

- Form 10-K des Konzerns, Abschnitt "Intellectual Property Protection and Regulatory
  Exclusivity" bzw. "Patents and Trademarks". Suche den Satz "composition of matter
  patent(s) covering INN ... expected to expire in JJJJ" und Settlement-Sätze "no generic
  entry ... prior to".
- EDGAR-Filing-Index: https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=CIK&type=10-K
- EDGAR-Volltextsuche: https://efts.sec.gov/LATEST/search-index?q=%22INN%22&forms=10-K
- Investor-Relations-Seiten spiegeln das 10-K als PDF.
- Europäische Konzerne: Geschäftsbericht ("Annual Report", Abschnitt Risiken oder
  Patente), oft weniger konkret.

## 4. Pipeline, Angriffe, Settlements

- ClinicalTrials.gov: Suche "INN biosimilar"; Studientitel nennen Kandidatencode und
  Referenzprodukt (EU-approved vs. US-licensed).
- EU CTIS: https://euclinicaltrials.eu (Suche nach INN).
- Hersteller-Pipelines: Sandoz, Celltrion, Samsung Bioepis, Alvotech, Bio-Thera, Formycon,
  Polpharma Biologics, Biocon, Henlius, Chong Kun Dang, Dong-A, Teva.
- PTAB (IPR, PGR): Unified Patents Portal, BiologicsHQ (Venable), Big Molecule Watch
  (Goodwin). Ein Angriff eines Biosimilar-Herstellers zeigt Pipeline-Interesse.
- EPO-Einsprüche: Europäisches Patentregister, Tab "Opposition".
- GaBI Online für Biosimilar-Zulassungen und Launches.

## 5. Aggregatoren (nur Hinweise, nie Beleg)

DrugPatentWatch, TheraRadar, PatentCliff, PharmaDossier, PatSnap-Blogs, Shortagewatch,
Preisregulierungsdokumente von US-Bundesstaaten (PDAB), Apotheken- und
Verbraucherportale. Nutze sie, um Patentnummern und Familien zu finden, und prüfe jede
Zahl gegen eine Primärquelle. Typische Fehler: Prioritätsdatum + 20 Jahre, veraltete
Schätzungen, Verwechslung von Exklusivität und Patent.

## 6. Wenn direkte Abrufe blockiert sind

In Cloud-Umgebungen mit Netzwerk-Allowlist scheitern direkte Abrufe (curl, WebFetch) von
sec.gov, fda.gov, patents.google.com, register.epo.org, espacenet und Investor-Relations-
Seiten oft mit DNS-Fehlern oder HTTP 403 des Proxys. Bewährt hat sich:

- **Serverseitige Websuche** (WebSearch): findet Federal-Register-Notices, EMA-Seiten,
  Pressemitteilungen, Studienregister.
- **Such-Connector mit Zielvorgabe** (z. B. Exa `web_search_exa` mit präzisem
  `objective`): extrahiert die gesuchte Passage aus großen 10-K-HTMLs und EMA-PDFs, ohne
  das ganze Dokument zu laden. Formuliere das Ziel als Satz, der im Dokument stehen muss.
- **Fetch-Connector** (z. B. Exa `web_fetch_exa`): liest Google-Patents-Seiten; für
  Antikörperpatente mit riesigen Sequenzlisten `maxCharacters` begrenzen und die
  WO-Seite statt der US-Seite nehmen. EPO-Register und Espacenet liefern damit meist
  nichts (Timeout, 403, leere Seite).
- Wenn ein Register nicht erreichbar bleibt: Wert berechnen, als berechnet kennzeichnen
  und dem Nutzer die konkreten Register und Nummern zur eigenen Prüfung nennen. Nicht
  raten, nicht aus dem Gedächtnis ergänzen.
