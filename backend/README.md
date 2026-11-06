# Anmeldung für den Wirt

Die Website liegt statisch auf GitHub Pages. Ein Passwort im Seitenquelltext wäre kein Schutz. Die Anmeldung läuft deshalb über ein Google-Apps-Script an einer privaten Google-Tabelle. Solange in `js/auth-config.js` keine Adresse steht, zeigt die Seite nur den Hinweis, dass die Anmeldung noch nicht aktiv ist.

Dieselbe Adresse `OWNER_EMAIL` bekommt jede neue Reservierung und jede Stornierung. Das Blatt `Reservierungen` speichert die Buchungen. Solange in `js/auth-config.js` keine `BACKEND_URL` steht, schickt das Formular nichts ab und bittet zum Telefon.

## Was das Skript tut

- Passwort nur als Salt und PBKDF2-HMAC-SHA256 (10.000 Runden), nie im Klartext
- Anmeldung gibt ein Sitzungs-Token zurück, 12 Stunden gültig; gespeichert wird nur der SHA-256 des Tokens
- Abmelden löscht diese Sitzung
- Passwort ändern verlangt das alte Passwort und bleibt nur mit gültiger Sitzung möglich
- Passwort vergessen schickt einen einmaligen Link an `OWNER_EMAIL`, eine Stunde gültig
- Nach 5 falschen Passwörtern in 15 Minuten pausiert die Anmeldung; der Zurücksetzen-Link höchstens 3 Mal pro Stunde
- Reservierung speichert Name, Telefon, E-Mail, Datum, Uhrzeit, Personen, Nachricht, Tisch und Sprache. Das Token für den Storno-Link liegt nur als SHA-256 in der Tabelle
- Der Gast bekommt die Bestätigung auf Deutsch, Englisch oder Griechisch, je nach Sprache der Website. Stornieren geht über `storno.html`: bis 6 Personen bis 24 Stunden vorher, darüber bis 2 Tage vorher
- Ein verstecktes Feld und ein Limit (8 Anfragen pro Stunde, 3 pro E-Mail-Adresse) halten automatische Einsendungen klein
- Die Wirt-Übersicht liest die echten Zeilen, sobald eine Sitzung besteht. Ohne Anmeldung bleibt sie zu

## Einrichten

1. Eine neue Google-Tabelle anlegen, nur für dieses Konto. Nicht öffentlich freigeben.
2. Erweiterungen → Apps Script. Den Inhalt von `backend/Code.gs` einfügen und speichern.
3. Projekteinstellungen → Skripteigenschaften:

   | Eigenschaft | Wert |
   | --- | --- |
   | `OWNER_EMAIL` | die Adresse des Wirts, z. B. später auch für Reservierungen |
   | `SITE_URL` | `https://gessnermarvyn.github.io/zeus-im-farmhaus/intern.html` |
   | `INITIAL_PASSWORD` | das erste Passwort, mindestens 10 Zeichen |
   | `TABLES` | optional, z. B. `1:4,2:4,3:4`. Leer bedeutet 16 Tische mit je 4 Plätzen, Belegung 150 Minuten |

   `INITIAL_PASSWORD` nur hier eintragen, nicht in die Website und nicht ins Repository.

4. Im Editor die Funktion `setupOwner` ausführen und den Zugriff erlauben. Danach ist `INITIAL_PASSWORD` gelöscht. In der Tabelle liegt in `Zugang` nur Salt und Hash.
5. Einmal `authorizeMail` ausführen. Das sendet eine kurze Testnachricht ohne Link und gibt den E-Mail-Versand frei.
6. Bereitstellen → Neue Bereitstellung → Typ: Web-App.
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
   - Die Adresse endet auf `/exec`. „Jeder“ darf die Adresse aufrufen, nicht die Tabelle öffnen.
7. In `js/auth-config.js` eintragen und auf `main` bringen:

```javascript
window.ZEUS_AUTH = {
  BACKEND_URL: 'https://script.google.com/macros/s/…/exec',
  OWNER_EMAIL: 'dieselbe-adresse@example.com'
};
```

`OWNER_EMAIL` in der Website und in den Skripteigenschaften muss dieselbe Adresse sein. Die Website zeigt sie beim Zurücksetzen an. Der Versand nutzt die Adresse aus den Skripteigenschaften.

## Prüfen

- Unten auf der Website steht klein „Intern“. Das öffnet die Anmeldung.
- `wirt.html` leitet ohne Sitzung auf die Anmeldung um.
- Falsches Passwort bleibt falsch. Nach fünf Versuchen kommt die Pause.
- „Passwort vergessen“ schickt den Link. „Passwort ändern“ verlangt das alte Passwort.
- Mit gesetzter `BACKEND_URL` speichert eine Probereservierung eine Zeile, schickt die Mail an den Gast und an `OWNER_EMAIL`, und der Link in der Mail storniert nur innerhalb der Frist.
- Ohne `BACKEND_URL` bleibt unter dem Formular der Hinweis, telefonisch zu reservieren.

Nach Änderungen an `Code.gs` die Web-App neu bereitstellen (Bereitstellungen → verwalten → neue Version), sonst läuft der alte Stand.

Die Anmeldung kann ein paar Sekunden dauern. Das ist die Absicht der vielen Hash-Runden.

## Grenze dieser Lösung

GitHub Pages liefert `wirt.html` weiterhin als Datei aus. Ohne gültige Sitzung leitet der Browser um, bevor die Seite sichtbar wird. Die Buchungen selbst stehen nur im Blatt `Reservierungen` und kommen in die Übersicht erst nach geprüfter Sitzung.

Zum Passwortwechsel im laufenden Betrieb „Passwort ändern“ nutzen. `setupOwner` überschreibt den Hash, wenn `INITIAL_PASSWORD` erneut gesetzt und die Funktion noch einmal ausgeführt wird. Dabei werden die Sitzungen gelöscht.
