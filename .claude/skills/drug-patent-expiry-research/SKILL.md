---
name: drug-patent-expiry-research
description: Recherchiert und berechnet, wann Patente, Laufzeitverlängerungen (US Patent Term Extension, EU-Schutzzertifikat SPC) und regulatorische Exklusivitäten (BPCIA 12 Jahre, Orange Book, EU 8+2+1, Orphan, Pädiatrie) eines Arzneimittels in den USA und der EU ablaufen und wann Biosimilars oder Generika frühestens auf den Markt kommen können. Nutze diesen Skill immer, wenn nach Patentablauf, Patentlaufzeit, "wann läuft das Patent ab", Loss of Exclusivity (LoE), Patent Cliff, Biosimilar- oder Generika-Eintritt, SPC, Patent Term Extension, Datenexklusivität oder Marktschutz eines Wirkstoffs oder Markenprodukts gefragt wird, auch wenn nur ein Wirkstoffname (INN) und das Wort "Patent" genannt werden, egal ob Biologikum oder Small Molecule.
---

# Patent- und Exklusivitätsablauf von Arzneimitteln (EU und USA)

## Grundprinzip

Die Frage "Wann läuft das Patent ab?" hat nie eine einzelne Antwort. Jedes Produkt ist
durch mehrere Schutzebenen abgesichert, die unterschiedlich lange laufen:

1. **Regulatorische Exklusivität.** USA: 12 Jahre Referenzprodukt-Exklusivität für
   Biologika (BPCIA) bzw. Orange-Book-Exklusivitäten für Small Molecules. EU: 8 Jahre
   Datenexklusivität plus 2 Jahre Marktschutz, plus 1 Jahr bei neuer Indikation mit
   signifikantem klinischem Nutzen.
2. **Stoffpatent (Composition of Matter) mit Laufzeitverlängerung.** USA: Patent Term
   Extension (PTE) auf genau ein Patent, gedeckelt auf 14 Jahre nach Zulassung. EU:
   ergänzendes Schutzzertifikat (SPC), national erteilt, maximal 15 Jahre nach erster
   EU-Zulassung, plus 6 Monate pädiatrische Verlängerung.
3. **Sekundärpatente.** Formulierung, Dosierung, Verwendung, Device, Herstellung. Laufen
   oft bis in die 2030er oder 2040er, sind aber angreifbar oder umgehbar.
4. **Realer Markteintritt** von Biosimilars oder Generika. Hängt von Pipeline,
   Patentstreitigkeiten und Settlements ab, nicht nur von Ablaufdaten.

Liefere immer alle vier Ebenen für beide Regionen, auch wenn nur "das Patent" gefragt
ist. Der Grund: Sekundärquellen nennen wild verschiedene Jahre, weil sie jeweils eine
andere Ebene meinen. Nur die geschichtete Darstellung macht die Angaben vergleichbar.

Kläre die eigentliche Fragestellung (formales Ablaufdatum, frühester Wettbewerbereintritt
oder komplette Patentlandschaft) nicht blockierend: erst vollständig antworten, dann
gezielte Rückfragen stellen.

## Ablauf

### Schritt 1: Produkt festlegen

Ermittle INN, Markenname, Originator und Lizenzkette (z. B. Risankizumab: Patente bei
Boehringer Ingelheim, Vermarktung durch AbbVie). Der Patentinhaber ist oft nicht der
Zulassungsinhaber, deshalb nach beiden suchen.

### Schritt 2: Zulassungsdaten als Anker

- **USA:** Zulassungsdatum und BLA- bzw. NDA-Nummer aus Drugs@FDA oder dem Purple Book
  (Biologika). Das Purple Book zeigt das Exklusivitätsende nur, wenn die FDA eine
  "first licensure"-Festlegung getroffen hat. Fehlt sie, berechne 12 Jahre ab Zulassung
  und kennzeichne das Datum als berechnet.
- **EU:** Datum "Marketing authorisation issued" und EU-Nummer (EU/1/JJ/NNNN) von der
  EMA-EPAR-Seite. Dieses Datum ist der Anker für Datenexklusivität, Marktschutz und
  SPC-Berechnung.

### Schritt 3: Aussage des Originators

Suche im aktuellen Form 10-K (Abschnitt "Intellectual Property Protection and
Regulatory Exclusivity") den Satz zum Stoffpatent und zitiere ihn wörtlich. US-Konzerne
nennen dort meist nur das US-Jahr. Ein 10-K ist die verlässlichste Quelle für das
erwartete US-Ablaufjahr, weil der Konzern haftet. Siehe `references/sources.md` für
Suchstrategien, wenn sec.gov nicht direkt erreichbar ist.

### Schritt 4: Stoffpatent und Verlängerung in den USA

1. Finde die Federal-Register-Notice "Determination of Regulatory Review Period for
   Purposes of Patent Extension; MARKE". Sie nennt die Patente, für die PTE beantragt
   wurde, und die beantragte Verlängerung in Tagen.
2. Öffne das Stoffpatent bei Google Patents: Anmeldedatum (PCT- bzw. US-Anmeldung, nicht
   das Prioritätsdatum), "Adjusted expiration" (enthält PTA und PTE) und die
   Patentfamilie.
3. Plausibilisiere: Verlängertes Datum minus reguläres Datum muss den PTE-Tagen
   entsprechen, und das Ergebnis darf 14 Jahre nach Zulassung nicht überschreiten.
4. Pädiatrische Exklusivität (+6 Monate) gibt es nur nach einem Written Request der FDA.
   Studien, die nur eine PREA-Auflage erfüllen, reichen nicht. Prüfe die FDA-Liste
   "Pediatric Exclusivity Granted" und das 10-K.
5. Small Molecules: Orange Book (Patente, Exklusivitätscodes NCE, NCI, ODE, PED),
   Paragraph-IV-Liste und Settlements im 10-K.

### Schritt 5: EP-Grundpatent und SPC in der EU

1. Die Google-Patents-Seite der WO-Veröffentlichung listet alle Familienmitglieder mit
   Nummern, darunter das EP-Patent und die SPC-Veröffentlichungen (Kind-Code I1 =
   Antrag, I2 = erteilt, z. B. NL3010xx, LUC00xxx, LTC..., CY..., NO...). Die US- oder
   EP-Seite verliert diese Nummern bei der Textextraktion, deshalb immer die WO-Seite
   abrufen.
2. EP-Laufzeit = Anmeldedatum + 20 Jahre. Es gibt keine Verzögerungsgutschrift wie die
   US-PTA. Teilanmeldungen (Divisionals) laufen am selben Tag ab wie die Stammanmeldung.
3. SPC-Ablauf berechnen (Art. 13 VO 469/2009): frühester Wert aus "EU-Zulassung + 15
   Jahre" und "Patentablauf + 5 Jahre". Pädiatrische Verlängerung: + 6 Monate, wenn der
   PIP abgeschlossen ist (Compliance-Opinion im EMA Assessment Report, Abschnitt
   "Information on paediatrics") und spätestens 2 Jahre vor SPC-Ablauf beantragt wird.
4. Kennzeichne den SPC-Ablauf als "berechnet", solange er nicht aus einem nationalen
   Register (DPMA, INPI, UK IPO, IPOI, PRV, Octrooicentrum NL) bestätigt ist. Register
   können um Tage abweichen, weil der Tag der Notifizierung der Kommissionsentscheidung
   zählt (EuGH C-471/14).
5. Marktschutz +1 Jahr: Prüfe im CHMP Assessment Report der Indikationserweiterung, ob
   "significant clinical benefit in comparison with existing therapies" anerkannt wurde.
   Ohne Beleg beide Daten nennen (10 bzw. 11 Jahre) und als unverifiziert markieren.

### Schritt 6: Sekundärpatente, Angriffe, Pipeline

- Formulierungs- und Dosierungspatente: über die Patentfamilien des Originators und
  Patentinhabers (Google Patents, Aggregatoren nur als Hinweisgeber).
- Angriffe: PTAB-Verfahren (IPR, PGR) über Unified Patents, BiologicsHQ, Big Molecule
  Watch; EPO-Einsprüche im Europäischen Patentregister. Ein gescheiterter Angriff eines
  Biosimilar-Herstellers ist zugleich ein Hinweis auf dessen Pipeline.
- Pipeline: ClinicalTrials.gov und EU CTIS mit "INN biosimilar", Pipeline-Seiten der
  Hersteller, GaBI Online, Purple Book 351(k)-Einträge, EMA-Liste der Biosimilars.
- Settlements und Lizenzvereinbarungen (z. B. "no generic entry expected prior to ...")
  stehen im 10-K und schlagen alle berechneten Daten.

### Schritt 7: Rechnen und plausibilisieren

Nutze `scripts/exclusivity_calc.py`, statt Fristen im Kopf zu addieren:

```bash
python3 scripts/exclusivity_calc.py --filing 2011-11-02 --eu-ma 2019-04-26 \
  --us-approval 2019-04-23 --pte-days 538 --paediatric
```

Das Skript liefert Datenexklusivität, Marktschutz, Patentablauf, SPC-Ablauf mit
Deckelung, BPCIA-Datum und PTE-Deckel. Vergleiche jedes Ergebnis mit mindestens einer
Primärquelle. Weicht eine Sekundärquelle ab (typisch: Prioritätsdatum + 20 Jahre statt
Anmeldedatum + 20 Jahre, oder eine Schätzung in einem Behördendokument), benenne die
Abweichung explizit in der Antwort, damit der Nutzer sie einordnen kann.

## Ausgabeformat

Antworte in der Sprache des Nutzers. Verwende immer diese Struktur:

```
**Kurzantwort:** Kein Einzelpatent. Stoffpatent regulär bis TT.MM.JJJJ. USA mit PTE bis
TT.MM.JJJJ. EU mit SPC bis ca. TT.MM.JJJJ (ggf. pädiatrisch bis ...).

**USA**
| Schutzrecht | Ablauf |
Zulassung (BLA/NDA) · 12-Jahres-Exklusivität bzw. Orange-Book-Exklusivitäten ·
Stoffpatent regulär / mit PTE (Patentnummer, PTE-Tage) · Verwendungs- und
Formulierungspatente · pädiatrische Exklusivität (Status)

**EU**
| Schutzrecht | Ablauf |
Zulassung (EU-Nummer) · Datenexklusivität 8 J. · Marktschutz 10 (11) J. ·
EP-Grundpatent (Nummer) · SPC (Länder, Nummern, berechnet oder bestätigt) ·
pädiatrische SPC-Verlängerung (Status)

**Einordnung für den Markteintritt** (USA, EU, Wettbewerber, Fehlangaben in Sekundärquellen)

**Unsicherheiten** (berechnet vs. registerbestätigt, nicht verifizierte Punkte)

**Rückfragen** (Fragestellung, Länder, Registerprüfung)

Sources: Primärquellen als Links
```

Regeln für die Tabellen: Datum als TT.MM.JJJJ, bei Unsicherheit "ca." und Grund.
Jede Zeile nennt das konkrete Schutzrecht mit Nummer. Berechnete Werte heißen
"berechnet", nicht verifizierte heißen "nicht verifiziert". Schreibe "bis" oder "von bis"
statt Gedankenstrichen.

## Qualitätsregeln und Fallstricke

- **Anmeldedatum, nicht Prioritätsdatum.** Patentlaufzeit = Anmeldedatum der
  PCT-/EP-/US-Anmeldung + 20 Jahre. Aggregatoren rechnen oft vom Prioritätsdatum und
  liegen damit ein Jahr zu früh.
- **PTE gilt für genau ein Patent** pro Zulassung. Es kann auf einem Verwendungspatent
  liegen statt auf dem Stoffpatent. Die Federal-Register-Notice klärt das.
- **Ein Datum ohne Schutzrecht ist wertlos.** Schreibe nie "das Patent läuft 2033 ab",
  sondern "US 8,778,346 mit PTE bis 23.04.2033".
- **Regulatorik und Patente laufen parallel.** Frühester Markteintritt = spätestes
  Datum aus regulatorischer Exklusivität und nicht umgangenen, nicht für nichtig
  erklärten Patenten. In der EU darf ein Biosimilar nach 8 Jahren zugelassen, aber
  erst nach 10 (11) Jahren und nach SPC-Ablauf vermarktet werden.
- **SPCs sind national.** UK zählt seit dem Brexit separat (SPC/GB), Schweiz und Norwegen
  haben eigene Regime. Für eine EU-Aussage genügt der Nachweis, dass SPCs erteilt sind,
  plus das berechnete Datum; für ein bestimmtes Land das Register.
- **Behörden- und Verbraucherseiten irren.** Schätzungen in Preisregulierungs-
  dokumenten, Marketing-Blogs oder Apothekenportalen sind keine Quellen. Primärquellen
  (10-K, FDA, EMA, USPTO, Google Patents, Register) entscheiden.
- **Fetch-Ausfälle sind kein Grund zu raten.** Wenn sec.gov, patents.google.com, EPO-
  Register oder fda.gov nicht erreichbar sind, nutze serverseitige Suche oder einen
  Fetch-Connector (siehe `references/sources.md`). Was trotzdem offen bleibt, wird als
  offen benannt.

## Referenzen

- `references/legal-framework.md`: Rechtsgrundlagen und Formeln für USA und EU, lies sie
  bei jeder Berechnung, die vom Standardfall abweicht (Orphan, Pädiatrie, Small
  Molecule, negative SPC-Laufzeit, Settlements).
- `references/sources.md`: Quellen mit URL-Mustern, was dort steht, und bewährte Wege,
  wenn direkte Abrufe blockiert sind.
- `references/example-risankizumab.md`: vollständig durchgerechnetes Beispiel
  (Skyrizi) als Kalibrierung für Umfang, Tiefe und Formulierung.
