# Anmeldung für den Wirt

Die Website liegt statisch auf GitHub Pages. Ein Passwort im Seitenquelltext wäre kein Schutz. Die Anmeldung läuft deshalb über ein Google-Apps-Script an einer privaten Google-Tabelle. Solange in `js/auth-config.js` keine Adresse steht, zeigt die Seite nur den Hinweis, dass die Anmeldung noch nicht aktiv ist.

Dieselbe Adresse `OWNER_EMAIL` ist später der Empfänger für Reservierungen. Das Blatt `Reservierungen` wird beim Einrichten angelegt. Der Versand der Reservierungen ist noch nicht angeschlossen.

## Was das Skript tut

- Passwort nur als Salt und PBKDF2-HMAC-SHA256 (10.000 Runden), nie im Klartext
- Anmeldung gibt ein Sitzungs-Token zurück, 12 Stunden gültig; gespeichert wird nur der SHA-256 des Tokens
- Abmelden löscht diese Sitzung
- Passwort ändern verlangt das alte Passwort und bleibt nur mit gültiger Sitzung möglich
- Passwort vergessen schickt einen einmaligen Link an `OWNER_EMAIL`, eine Stunde gültig
- Nach 5 falschen Passwörtern in 15 Minuten pausiert die Anmeldung; der Zurücksetzen-Link höchstens 3 Mal pro Stunde

## Einrichten

1. Eine neue Google-Tabelle anlegen, nur für dieses Konto. Nicht öffentlich freigeben.
2. Erweiterungen → Apps Script. Den Inhalt von `backend/Code.gs` einfügen und speichern.
3. Projekteinstellungen → Skripteigenschaften:

   | Eigenschaft | Wert |
   | --- | --- |
   | `OWNER_EMAIL` | die Adresse des Wirts, z. B. später auch für Reservierungen |
   | `SITE_URL` | `https://gessnermarvyn.github.io/zeus-im-farmhaus/intern.html` |
   | `INITIAL_PASSWORD` | das erste Passwort, mindestens 10 Zeichen |

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

Die Anmeldung kann ein paar Sekunden dauern. Das ist die Absicht der vielen Hash-Runden.

## Grenze dieser Lösung

GitHub Pages liefert `wirt.html` weiterhin als Datei aus. Ohne gültige Sitzung leitet der Browser um, bevor die Seite sichtbar wird. Solange dort nur Beispieldaten stehen, ist das in Ordnung. Echte Reservierungen dürfen nicht in die HTML-Datei, sondern nur in das Blatt `Reservierungen`, und nur nach geprüfter Sitzung zurück an den Browser.

Zum Passwortwechsel im laufenden Betrieb „Passwort ändern“ nutzen. `setupOwner` überschreibt den Hash, wenn `INITIAL_PASSWORD` erneut gesetzt und die Funktion noch einmal ausgeführt wird. Dabei werden die Sitzungen gelöscht.
