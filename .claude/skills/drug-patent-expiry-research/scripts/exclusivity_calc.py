#!/usr/bin/env python3
"""Berechnet Schutzfristen eines Arzneimittels in EU und USA aus wenigen Eckdaten.

Beispiel (Risankizumab / Skyrizi):
  python3 exclusivity_calc.py --filing 2011-11-02 --eu-ma 2019-04-26 \
      --us-approval 2019-04-23 --pte-days 538 --paediatric

Alle Daten im Format JJJJ-MM-TT. Ergebnis ist eine Rechnung nach Gesetz, kein Ersatz
fuer Register: SPC- und PTE-Daten immer gegen Primaerquellen pruefen.
"""
import argparse
import calendar
from datetime import date, timedelta


def add_months(d: date, months: int) -> date:
    y = d.year + (d.month - 1 + months) // 12
    m = (d.month - 1 + months) % 12 + 1
    last = calendar.monthrange(y, m)[1]
    return date(y, m, min(d.day, last))


def add_years(d: date, years: int) -> date:
    return add_months(d, 12 * years)


def fmt(d) -> str:
    return d.strftime("%d.%m.%Y") if d else "-"


def parse(s):
    return date.fromisoformat(s) if s else None


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--filing", help="Anmeldedatum des Grundpatents (PCT/EP/US), JJJJ-MM-TT")
    p.add_argument("--patent-expiry", help="Regulaeres Ablaufdatum, falls abweichend von Anmeldung + 20 Jahre (z. B. US mit PTA)")
    p.add_argument("--eu-ma", help="Datum der EU-Zulassung (Kommissionsentscheidung)")
    p.add_argument("--eu-ma-notified", help="Notifizierungsdatum der EU-Zulassung, falls bekannt (massgeblich fuer SPC)")
    p.add_argument("--eu-extra-year", action="store_true", help="Zusatzjahr Marktschutz (neue Indikation mit signifikantem klinischem Nutzen)")
    p.add_argument("--eu-orphan", action="store_true", help="Orphan-Marktexklusivitaet EU (10 Jahre, +2 bei PIP)")
    p.add_argument("--paediatric", action="store_true", help="Paediatrische Verlaengerung EU (+6 Monate SPC bzw. +2 Jahre Orphan)")
    p.add_argument("--us-approval", help="Datum der FDA-Zulassung")
    p.add_argument("--us-nce", action="store_true", help="Small Molecule mit NCE-Exklusivitaet statt BPCIA")
    p.add_argument("--us-pediatric", action="store_true", help="Paediatrische Exklusivitaet USA gewaehrt (+6 Monate)")
    p.add_argument("--pte-days", type=int, help="Patent Term Extension in Tagen (Federal Register / USPTO)")
    a = p.parse_args()

    rows = []
    filing = parse(a.filing)
    patent_expiry = parse(a.patent_expiry) or (add_years(filing, 20) if filing else None)
    if patent_expiry:
        src = "angegeben" if a.patent_expiry else "Anmeldung + 20 Jahre"
        rows.append(("Grundpatent regulaer", fmt(patent_expiry), src))

    eu_ma = parse(a.eu_ma)
    if eu_ma:
        rows.append(("EU-Zulassung", fmt(eu_ma), ""))
        rows.append(("EU Datenexklusivitaet (8 J.)", fmt(add_years(eu_ma, 8)), "ab dann Biosimilar-/Generika-Antrag moeglich"))
        years = 11 if a.eu_extra_year else 10
        rows.append((f"EU Marktschutz ({years} J.)", fmt(add_years(eu_ma, years)), "Vermarktung erst danach; 11 J. nur mit anerkanntem Zusatznutzen"))
        if a.eu_orphan:
            oy = 12 if a.paediatric else 10
            rows.append((f"EU Orphan-Marktexklusivitaet ({oy} J.)", fmt(add_years(eu_ma, oy)), ""))
        ref = parse(a.eu_ma_notified) or eu_ma
        if filing:
            duration_days = (ref - add_years(filing, 5)).days
            if duration_days <= 0:
                spc = patent_expiry + timedelta(days=duration_days)
                rows.append(("EU SPC", f"Laufzeit {duration_days} Tage", "negatives SPC; nur sinnvoll als Traeger der paediatrischen Verlaengerung (EuGH C-125/10)"))
            else:
                spc = min(add_years(ref, 15), add_years(patent_expiry, 5))
                cap = "15 J. nach Zulassung" if add_years(ref, 15) <= add_years(patent_expiry, 5) else "Patentablauf + 5 J."
                note = f"berechnet, Deckel: {cap}; massgeblich ist das Notifizierungsdatum"
                rows.append(("EU SPC (berechnet)", fmt(spc), note))
            if a.paediatric and not a.eu_orphan:
                paed = add_months(spc, 6)
                note = "nur bei abgeschlossenem PIP; Antrag spaetestens 2 J. vor SPC-Ablauf"
                if paed <= patent_expiry:
                    note += "; liegt vor Patentablauf, bringt also nichts"
                rows.append(("EU SPC + paediatrische Verlaengerung", fmt(paed), note))

    us = parse(a.us_approval)
    if us:
        rows.append(("FDA-Zulassung", fmt(us), ""))
        if a.us_nce:
            nce = add_years(us, 5)
            rows.append(("US NCE-Exklusivitaet (5 J.)", fmt(add_months(nce, 6) if a.us_pediatric else nce), "Paragraph-IV-Einreichung ab Jahr 4"))
            rows.append(("US NCE-1 (Paragraph IV ab)", fmt(add_years(us, 4)), ""))
        else:
            bp = add_years(us, 12)
            rows.append(("US BPCIA-Exklusivitaet (12 J.)", fmt(add_months(bp, 6) if a.us_pediatric else bp), "berechnet, falls Purple Book kein Datum zeigt"))
            rows.append(("US 351(k)-Antrag moeglich ab", fmt(add_years(us, 4)), ""))
        cap = add_years(us, 14)
        rows.append(("US PTE-Deckel (14 J. nach Zulassung)", fmt(cap), ""))
        if a.pte_days is not None and patent_expiry:
            ext = patent_expiry + timedelta(days=a.pte_days)
            final = min(ext, cap)
            if a.us_pediatric:
                final = add_months(final, 6)
            rows.append((f"US Patent mit PTE ({a.pte_days} Tage)", fmt(final), "gedeckelt" if ext > cap else "ungedeckelt"))

    if not rows:
        p.print_help()
        return
    w = max(len(r[0]) for r in rows)
    for name, val, note in rows:
        line = f"{name:<{w}}  {val}"
        if note:
            line += f"  ({note})"
        print(line)


if __name__ == "__main__":
    main()
