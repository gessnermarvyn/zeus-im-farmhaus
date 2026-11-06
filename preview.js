/* ===== Vorschau-Funktionen: Sprache, Reservierung (Demo) ===== */
const $=id=>document.getElementById(id);
const TR={ // Deutsch -> [English, Ελληνικά]
"Vorschau / Demo ·":["Preview / Demo ·","Προεπισκόπηση / Demo ·"],"Wirt-Übersicht":["Owner overview","Επισκόπηση ιδιοκτήτη"],
"Geschichte":["Our Story","Ιστορία"],"Essen":["Food","Φαγητό"],"Spezialitäten":["Specialities","Σπεσιαλιτέ"],"Getränke":["Drinks","Ποτά"],"Anreise":["Directions","Πρόσβαση"],"Hotel":["Hotel","Ξενοδοχείο"],
"Reservieren":["Reserve","Κράτηση"],"Foto: Dierkschneider":["Photo: Dierkschneider","Φωτογραφία: Dierkschneider"],
"Griechisches Restaurant · Lienen":["Greek Restaurant · Lienen","Ελληνικό εστιατόριο · Lienen"],
"Griechische Küche im Fachwerkhaus von 1650":["Greek cuisine in a half-timbered house from 1650","Ελληνική κουζίνα σε ξυλότυπο σπίτι του 1650"],
"Speisekarte":["Menu","Μενού"],"Mi – Mo · 17:30 – 23:00":["Wed – Mon · 5:30 – 11 pm","Τετ – Δευ · 17:30 – 23:00"],"Dienstag Ruhetag":["Closed on Tuesdays","Τρίτη κλειστά"],
"Seit":["For","Εδώ και"],"32 Jahren":["32 years","32 χρόνια"],"Gastronomie im Farmhaus":["of hospitality in the Farmhaus","φιλοξενία στο Farmhaus"],"Familien & Radfahrer willkommen":["Families & cyclists welcome","Καλωσορίζουμε οικογένειες & ποδηλάτες"],
"Unsere Geschichte":["Our Story","Η ιστορία μας"],"Ein Haus von 1650,":["A house from 1650,","Ένα σπίτι του 1650,"],"ein neues Kapitel":["a new chapter","ένα νέο κεφάλαιο"],
"Zeus im Farmhaus blickt stolz auf 32 Jahre Geschichte zurück – voller köstlicher, traditioneller Gerichte. Unter den Balken des alten Vier-Ständer-Fachwerkhauses kommen seitdem Familien, Freunde und Radfahrer zusammen.":["Zeus im Farmhaus looks back proudly on 32 years of history – full of delicious, traditional dishes. Beneath the beams of this old half-timbered farmhouse, families, friends and cyclists have been coming together ever since.","Το Zeus im Farmhaus κοιτάζει με περηφάνια πίσω σε 32 χρόνια ιστορίας – γεμάτα νόστιμα, παραδοσιακά πιάτα. Κάτω από τα δοκάρια του παλιού ξυλότυπου σπιτιού συναντιούνται από τότε οικογένειες, φίλοι και ποδηλάτες."],
"Am 16. Mai 2026 haben Georgios Tzaras – von allen nur „Zeus“ genannt – und Panagiotis Koutelidas das Restaurant neu eröffnet: mit griechischer Küche, ehrlichen Zutaten und viel Herzlichkeit.":["On 16 May 2026, Georgios Tzaras – known to everyone as “Zeus” – and Panagiotis Koutelidas reopened the restaurant: with Greek cooking, honest ingredients and a warm welcome.","Στις 16 Μαΐου 2026 ο Γιώργος Τζάρας – που όλοι τον λένε «Ζευς» – και ο Παναγιώτης Κουτελίδας άνοιξαν ξανά το εστιατόριο: με ελληνική κουζίνα, τίμια υλικά και πολλή φιλοξενία."],
"Baujahr":["Built","Έτος κατασκευής"],"Jahre Tradition":["Years of tradition","Χρόνια παράδοσης"],"Neueröffnung":["Reopening","Επαναλειτουργία"],
"Unsere":["Our","Το"],"Alle Hauptgerichte werden mit einem Beilagensalat serviert. Beilage nach Wahl: Pommes, Knoblauchkartoffeln, Gemüsereis oder Pfannengemüse.":["All main courses are served with a side salad. Side of your choice: fries, garlic potatoes, vegetable rice or pan-fried vegetables.","Όλα τα κυρίως πιάτα σερβίρονται με σαλάτα. Συνοδευτικό της επιλογής σας: πατάτες τηγανητές, σκορδάτες πατάτες, ρύζι με λαχανικά ή σοταρισμένα λαχανικά."],
"Vorspeisen":["Starters","Ορεκτικά"],"Salate":["Salads","Σαλάτες"],"Vegetarisch":["Vegetarian","Χορτοφαγικά"],"Hauptgerichte":["Main courses","Κυρίως πιάτα"],"Grill & Fisch":["Grill & Fish","Σχάρα & Ψάρι"],"Desserts":["Desserts","Επιδόρπια"],
"Alle Preise inkl. MwSt. · Allergene: A Gluten, C Ei, D Fisch, G Milch/Laktose ·":["All prices incl. VAT · Allergens: A gluten, C egg, D fish, G milk/lactose ·","Όλες οι τιμές με ΦΠΑ · Αλλεργιογόνα: A γλουτένη, C αυγό, D ψάρι, G γάλα/λακτόζη ·"],
"Speisekarte als PDF":["Menu (PDF, German)","Μενού (PDF, γερμανικά)"],"Was Sie bei uns":["What you should","Τι πρέπει"],"probieren sollten":["try with us","να δοκιμάσετε"],
"Kalte Vorspeisen für zwei Personen, traditionell als Meze serviert – auf Wunsch mit Ouzo nach Wahl auf Eis.":["Cold starters for two, served the traditional meze way – with ouzo of your choice on ice if you like.","Κρύα ορεκτικά για δύο, σερβιρισμένα παραδοσιακά ως μεζέδες – αν θέλετε με ούζο της επιλογής σας με πάγο."],
"Hacksteak aus Schwein und Rind, gefüllt mit Feta – die Spezialität des Hauses.":["Pork and beef patty filled with feta – the house speciality.","Μπιφτέκι από χοιρινό και μοσχάρι γεμιστό με φέτα – η σπεσιαλιτέ του σπιτιού."],
"Klassisches Moussaka":["Classic moussaka","Κλασικός μουσακάς"],"Griechischer Auberginenauflauf mit Hackfleisch und Béchamelsauce.":["Greek aubergine bake with minced meat and béchamel.","Μελιτζάνες στο φούρνο με κιμά και μπεσαμέλ."],
"Geschmorte Lammhaxe":["Braised lamb shank","Αρνί κότσι κοκκινιστό"],"Langsam geschmortes Lamm mit grünen Bohnen in Tomatensauce.":["Slow-braised lamb with green beans in tomato sauce.","Αργομαγειρεμένο αρνί με φασολάκια σε σάλτσα ντομάτας."],
"Großer Grillteller":["Large grill platter","Μεγάλη ποικιλία σχάρας"],"Gyros, ein Souvlaki und ein Souzuki mit Beilage nach Wahl.":["Gyros, one souvlaki and one soutzouki with a side of your choice.","Γύρος, ένα σουβλάκι και ένα σουτζούκι με συνοδευτικό της επιλογής σας."],
"Gebackener Feta mit Tomaten, Paprika und Kräutern.":["Baked feta with tomatoes, peppers and herbs.","Φέτα ψητή με ντομάτα, πιπεριά και μυρωδικά."],
"Gebackener Feta mit Tomaten, Paprika und Kräutern":["Baked feta with tomatoes, peppers and herbs","Φέτα ψητή με ντομάτα, πιπεριά και μυρωδικά"],
"„Ein Stück Griechenland im Herzen von Lienen.“":["“A piece of Greece in the heart of Lienen.”","«Ένα κομμάτι Ελλάδας στην καρδιά του Lienen.»"],
"Prost!":["Cheers!","Στην υγειά μας!"],"Frisch gezapftes Bier, griechische Weine, Ouzo und Metaxa, dazu griechischer Mokka – eine Auswahl aus unserer Getränkekarte.":["Draught beer, Greek wines, ouzo and Metaxa, plus Greek coffee – a selection from our drinks menu.","Βαρελίσια μπίρα, ελληνικά κρασιά, ούζο και Metaxa, και ελληνικός καφές – μια επιλογή από τον κατάλογο ποτών μας."],
"Alle Preise inkl. MwSt. ·":["All prices incl. VAT ·","Όλες οι τιμές με ΦΠΑ ·"],"Vollständige Getränkekarte als PDF":["Full drinks menu (PDF, German)","Πλήρης κατάλογος ποτών (PDF, γερμανικά)"],
"Besuch & Anreise":["Visit & Directions","Επίσκεψη & Πρόσβαση"],"Wir freuen uns":["We look forward","Ανυπομονούμε"],"auf Ihren Besuch":["to your visit","για την επίσκεψή σας"],
"Öffnungszeiten":["Opening hours","Ώρες λειτουργίας"],"Montag":["Monday","Δευτέρα"],"Dienstag":["Tuesday","Τρίτη"],"Ruhetag":["Closed","Κλειστά"],"Mittwoch":["Wednesday","Τετάρτη"],"Donnerstag":["Thursday","Πέμπτη"],"Freitag":["Friday","Παρασκευή"],"Samstag":["Saturday","Σάββατο"],"Sonntag":["Sunday","Κυριακή"],
"Adresse":["Address","Διεύθυνση"],"Route planen":["Get directions","Οδηγίες διαδρομής"],"Auto":["Car","Αυτοκίνητο"],"— Parkmöglichkeiten in der Nähe":["— parking nearby","— στάθμευση κοντά"],"Bahn":["Train","Τρένο"],"— vom Bahnhof Lienen ca. 8 Minuten zu Fuß":["— about 8 minutes on foot from Lienen station","— περίπου 8 λεπτά με τα πόδια από τον σταθμό Lienen"],"Bus":["Bus","Λεωφορείο"],"— Haltestelle „Rathaus“":["— stop “Rathaus”","— στάση «Rathaus»"],"Fahrrad":["Bicycle","Ποδήλατο"],"— Radfahrer sind herzlich willkommen":["— cyclists are very welcome","— οι ποδηλάτες είναι ευπρόσδεκτοι"],
"Übernachten im selben Haus":["Stay in the same house","Διαμονή στο ίδιο σπίτι"],"Nach dem Abendessen einfach bleiben: Unter demselben Dach liegt das Hotel Altes Farmhaus – ein schöner Ausgangspunkt für Touren durch das Tecklenburger Land.":["Simply stay after dinner: Hotel Altes Farmhaus is under the same roof – a lovely base for exploring the Tecklenburger Land.","Μείνετε μετά το δείπνο: κάτω από την ίδια στέγη βρίσκεται το Hotel Altes Farmhaus – ιδανική βάση για εξορμήσεις στο Tecklenburger Land."],
"pro Nacht im Doppelzimmer":["per night, double room","ανά νύχτα, δίκλινο"],"ab 14:00 Uhr":["from 2 pm","από τις 14:00"],"bis 10:00 Uhr":["until 10 am","έως τις 10:00"],"Hotel anrufen · 05483 8363":["Call the hotel · +49 5483 8363","Κλήση ξενοδοχείου · +49 5483 8363"],"Website":["Website","Ιστοσελίδα"],
"Reservierung":["Reservation","Κράτηση"],"Ihr Tisch":["Your table","Το τραπέζι σας"],"erwartet Sie":["awaits","σας περιμένει"],"Reservieren Sie online – oder ganz klassisch unter":["Book online – or simply call us at","Κάντε κράτηση online – ή καλέστε μας στο"],
"So funktioniert’s":["How it works","Πώς λειτουργεί"],"Wählen Sie Datum, Uhrzeit und Personenzahl. Wir bestätigen Ihre Reservierung telefonisch oder per E-Mail.":["Choose date, time and party size. We will confirm your reservation by phone or email.","Επιλέξτε ημερομηνία, ώρα και αριθμό ατόμων. Θα επιβεβαιώσουμε την κράτηση τηλεφωνικά ή με email."],
"— Mi – Mo, 17:30 – 23:00":["— Wed – Mon, 5:30 – 11 pm","— Τετ – Δευ, 17:30 – 23:00"],"— Ruhetag":["— closed","— κλειστά"],"Gruppen ab 9 Personen":["Groups of 9 or more","Ομάδες από 9 άτομα"],"— bitte telefonisch":["— please call","— παρακαλούμε τηλεφωνικά"],
"Name":["Name","Όνομα"],"Telefon":["Phone","Τηλέφωνο"],"E-Mail":["Email","Email"],"Datum":["Date","Ημερομηνία"],"Uhrzeit":["Time","Ώρα"],"Personen":["Guests","Άτομα"],"Nachricht (optional)":["Message (optional)","Μήνυμα (προαιρετικό)"],"Tisch anfragen":["Request a table","Αίτημα κράτησης"],
"Online-Reservierung in Kürze – bis dahin bitte telefonisch: 05483 749534":["Online booking coming soon – until then please call: +49 5483 749534","Η online κράτηση έρχεται σύντομα – μέχρι τότε τηλεφωνικά: +49 5483 749534"],"Vorschau / Demo – es wird keine Anfrage gesendet.":["Preview / demo – no request will be sent.","Προεπισκόπηση / demo – δεν αποστέλλεται αίτημα."],"Online-Reservierung folgt in Kürze – bitte reservieren Sie telefonisch:":["Online booking is coming soon – please reserve by phone:","Η online κράτηση έρχεται σύντομα – παρακαλούμε κάντε κράτηση τηλεφωνικά:"],"Vielen Dank!":["Thank you!","Ευχαριστούμε!"],"Ihre Anfrage ist eingegangen. Wir melden uns zur Bestätigung.":["We have received your request and will be in touch to confirm.","Λάβαμε το αίτημά σας και θα επικοινωνήσουμε για επιβεβαίωση."],
"Vorschau / Demo – diese Anfrage wurde NICHT an das Restaurant gesendet.":["Preview / demo – this request was NOT sent to the restaurant.","Προεπισκόπηση / demo – το αίτημα ΔΕΝ στάλθηκε στο εστιατόριο."],"Neue Anfrage":["New request","Νέο αίτημα"],
"Griechisches Restaurant im historischen Fachwerkhaus von 1650.":["Greek restaurant in a historic half-timbered house from 1650.","Ελληνικό εστιατόριο σε ιστορικό ξυλότυπο σπίτι του 1650."],"Kontakt":["Contact","Επικοινωνία"],"Mittwoch – Montag":["Wednesday – Monday","Τετάρτη – Δευτέρα"],"17:30 – 23:00 Uhr":["5:30 – 11 pm","17:30 – 23:00"],"Impressum":["Legal notice","Νομικές πληροφορίες"],"Datenschutz":["Privacy","Απόρρητο"],"Anrufen":["Call","Κλήση"],
"Titelfoto: Dierkschneider / Altes Farmhaus Lienen · Zeus-Münze: Tetradrachme Philipps II., Cabinet des Médailles Paris, Foto":["Cover photo: Dierkschneider / Altes Farmhaus Lienen · Zeus coin: tetradrachm of Philip II, Cabinet des Médailles Paris, photo","Φωτογραφία: Dierkschneider / Altes Farmhaus Lienen · Νόμισμα Δία: τετράδραχμο Φιλίππου Β΄, Cabinet des Médailles Παρίσι, φωτογραφία"]
};
const UI={ // dynamische Texte
 de:{req:"Bitte ausfüllen.",mail:"Bitte gültige E-Mail angeben.",tel:"Bitte gültige Telefonnummer angeben.",tue:"Dienstag ist Ruhetag – bitte anderen Tag wählen.",past:"Bitte ein Datum ab heute wählen.",pers:n=>n+(n==1?" Person":" Personen"),big:"9+ Personen (bitte anrufen)",bigCall:"Ab 9 Personen bitten wir um einen Anruf.",open:"Jetzt geöffnet",closedT:"Heute Ruhetag",later:"Heute geöffnet ab 17:30 Uhr",sum:["Name","Datum","Uhrzeit","Personen"],send:"Reservierung senden",booked:t=>"Vielen Dank. Wir haben "+(t?"Tisch "+t+" ":"")+"für Sie notiert und schicken die Bestätigung an Ihre E-Mail.",full:"Zu dieser Zeit ist kein Tisch mehr frei. Bitte rufen Sie uns an: 05483 749534.",rate:"Zu viele Anfragen. Bitte warten Sie einen Moment oder rufen Sie an: 05483 749534.",down:"Die Reservierung ist gerade nicht erreichbar. Bitte rufen Sie an: 05483 749534.",fail:"Das hat nicht geklappt. Bitte versuchen Sie es noch einmal oder rufen Sie an: 05483 749534."},
 en:{req:"Please fill in.",mail:"Please enter a valid email.",tel:"Please enter a valid phone number.",tue:"We are closed on Tuesdays – please choose another day.",past:"Please choose today or a later date.",pers:n=>n+(n==1?" guest":" guests"),big:"9+ guests (please call)",bigCall:"For parties of 9 or more, please call us.",open:"Open now",closedT:"Closed today",later:"Open today from 5:30 pm",sum:["Name","Date","Time","Guests"],send:"Send reservation",booked:t=>"Thank you. We have noted "+(t?"table "+t+" ":"a table ")+"for you and will email your confirmation.",full:"No table is free at that time. Please call us: +49 5483 749534.",rate:"Too many requests. Please wait a moment or call +49 5483 749534.",down:"Booking is unavailable just now. Please call +49 5483 749534.",fail:"That did not work. Please try again or call +49 5483 749534."},
 el:{req:"Συμπληρώστε το πεδίο.",mail:"Εισάγετε έγκυρο email.",tel:"Εισάγετε έγκυρο τηλέφωνο.",tue:"Την Τρίτη είμαστε κλειστά – επιλέξτε άλλη ημέρα.",past:"Επιλέξτε σημερινή ή μελλοντική ημερομηνία.",pers:n=>n+(n==1?" άτομο":" άτομα"),big:"9+ άτομα (τηλεφωνικά)",bigCall:"Από 9 άτομα, παρακαλούμε τηλεφωνήστε.",open:"Ανοιχτά τώρα",closedT:"Σήμερα κλειστά",later:"Ανοιχτά σήμερα από 17:30",sum:["Όνομα","Ημερομηνία","Ώρα","Άτομα"],send:"Αποστολή κράτησης",booked:t=>"Ευχαριστούμε. Σημειώσαμε "+(t?"το τραπέζι "+t+" ":"τραπέζι ")+"και στέλνουμε την επιβεβαίωση στο email σας.",full:"Αυτή την ώρα δεν υπάρχει ελεύθερο τραπέζι. Καλέστε μας: +49 5483 749534.",rate:"Πολλά αιτήματα. Περιμένετε λίγο ή καλέστε το +49 5483 749534.",down:"Η κράτηση δεν είναι διαθέσιμη αυτή τη στιγμή. Καλέστε το +49 5483 749534.",fail:"Κάτι δεν πήγε καλά. Δοκιμάστε ξανά ή καλέστε μας."}
};
const DISH_EN={"Bauernsalat Farmhaus":"Greek farmer’s salad","Hähnchen Salat":"Chicken salad","Grüner Salat":"Green salad","Kleiner Beilagensalat":"Small side salad","Knoblauchbrot":"Garlic bread","Gegrillte Peperoni":"Grilled peppers","Rote-Bete-Salat":"Beetroot salad","Gemista":"Stuffed tomatoes & peppers","Fasolakia":"Green beans","Ofengemüse mit Feta":"Oven vegetables with feta","Hähnchenbrustfilet vom Grill":"Grilled chicken breast","Schweinefiletmedaillons":"Pork tenderloin medallions","Souvlaki vom Schwein":"Pork souvlaki","Klassisches Moussaka":"Classic moussaka","Geschmorte Lammhaxe":"Braised lamb shank","Kleiner Grillteller":"Small grill platter","Großer Grillteller":"Large grill platter","Taxi-Teller":"Taxi platter","Lachsfilet vom Grill":"Grilled salmon","Doradenfilet":"Sea bream fillet","Griechischer Joghurt":"Greek yoghurt","Hauskuchen":"Homemade cake"};
Object.assign(TR,{
"Lienen · seit 1650":["Lienen · since 1650","Lienen · από το 1650"],
"Check-in":["Check-in","Άφιξη"],"Check-out":["Check-out","Αναχώρηση"],
"[Betreiber / Rechtsform]":["[Operator / legal form]","[Φορέας / νομική μορφή]"],
"USt-ID: [bitte ergänzen]":["VAT ID: [to be added]","ΑΦΜ: [συμπληρώστε]"],
"· Ouzo + 5,00 €":["· ouzo + €5.00","· ούζο + 5,00 €"],
"Ouzo Meze":["Ouzo meze","Ούζο μεζές"],"Bifteki Farmhaus":["Farmhaus bifteki","Μπιφτέκι Farmhaus"],"Feta Fourno":["Baked feta","Φέτα φούρνου"],
"Tzatziki":["Tzatziki","Τζατζίκι"],"Taramas":["Tarama","Ταραμάς"],"Rote-Bete-Salat":["Beetroot salad","Σαλάτα με παντζάρι"],
"Dakos":["Dakos","Ντάκος"],"Gegrillte Peperoni":["Grilled peppers","Ψητές πιπεριές"],"Kolokithokeftedes":["Zucchini fritters","Κολοκυθοκεφτέδες"],
"Knoblauchbrot":["Garlic bread","Σκορδόψωμο"],"Spanakopita":["Spanakopita","Σπανακόπιτα"],
"Bauernsalat Farmhaus":["Farmhaus Greek salad","Χωριάτικη Farmhaus"],"Grüner Salat":["Green salad","Πράσινη σαλάτα"],
"Hähnchen Salat":["Chicken salad","Σαλάτα με κοτόπουλο"],"Kleiner Beilagensalat":["Small side salad","Μικρή σαλάτα"],
"Fasolakia":["Green beans","Φασολάκια"],"Gemista":["Stuffed vegetables","Γεμιστά"],"Ofengemüse mit Feta":["Oven vegetables with feta","Λαχανικά φούρνου με φέτα"],
"Hähnchenbrustfilet vom Grill":["Grilled chicken breast","Στήθος κοτόπουλου σχάρας"],"Schweinefiletmedaillons":["Pork medallions","Μεδαγιόν χοιρινού"],
"Souvlaki vom Schwein":["Pork souvlaki","Σουβλάκι χοιρινό"],"Kleiner Grillteller":["Small grill platter","Μικρή ποικιλία σχάρας"],
"Taxi-Teller":["Taxi platter","Πιάτο Taxi"],"Lachsfilet vom Grill":["Grilled salmon","Φιλέτο σολομού σχάρας"],"Doradenfilet":["Sea bream fillet","Φιλέτο τσιπούρας"],
"Griechischer Joghurt":["Greek yoghurt","Γιαούρτι"],"Hauskuchen":["Homemade cake","Κέικ του σπιτιού"],
"Joghurt-Quark-Creme mit Gurken, Knoblauch und Olivenöl":["Yoghurt with cucumber, garlic and olive oil","Γιαούρτι με αγγούρι, σκόρδο και ελαιόλαδο"],
"Traditioneller Dip aus feinem Fischrogen, Olivenöl und Zitrone":["A traditional dip of fish roe, olive oil and lemon","Παραδοσιακός ταραμάς με ελαιόλαδο και λεμόνι"],
"Gebackene Rote Bete mit griechischem Joghurt und gerösteten Walnüssen":["Baked beetroot with Greek yoghurt and toasted walnuts","Ψητό παντζάρι με γιαούρτι και καρυδόψιχα"],
"Gerstenzwieback mit Tomaten, Feta und Olivenöl":["Barley rusk with tomatoes, feta and olive oil","Παξιμάδι κριθαρένιο με ντομάτα, φέτα και ελαιόλαδο"],
"In Olivenöl gegrillt, mit Knoblauch abgeschmeckt":["Grilled in olive oil, finished with garlic","Ψητές σε ελαιόλαδο, με σκόρδο"],
"Gebratene Zucchinibällchen mit Joghurt-Dip":["Fried zucchini fritters with a yoghurt dip","Τηγανητοί κολοκυθοκεφτέδες με γιαούρτι"],
"Frisches Brot mit Knoblauch und Olivenöl":["Fresh bread with garlic and olive oil","Φρέσκο ψωμί με σκόρδο και ελαιόλαδο"],
"Zwei Blätterteigtaschen mit Spinat und Feta, dazu Tzatziki":["Two filo parcels of spinach and feta, with tzatziki","Δύο σπανακόπιτες με τζατζίκι"],
"Kalte Vorspeisen für zwei Personen · Ouzo nach Wahl +5,00 €":["Cold starters for two · ouzo of your choice + €5.00","Κρύα ορεκτικά για δύο · ούζο της επιλογής σας +5,00 €"],
"Tomaten, Gurken, Zwiebeln, Feta und Kalamata-Oliven":["Tomatoes, cucumber, onion, feta and Kalamata olives","Ντομάτα, αγγούρι, κρεμμύδι, φέτα και ελιές Καλαμάτας"],
"Frischer Blattsalat mit Zitrone und Olivenöl":["Leaves with lemon and olive oil","Πράσινα φύλλα με λεμόνι και ελαιόλαδο"],
"Bunter Salat mit gegrillter Hähnchenbrust":["Mixed salad with grilled chicken breast","Ανάμεικτη σαλάτα με στήθος κοτόπουλου σχάρας"],
"Grüne Bohnen in Tomatensauce, mit Feta überbacken":["Green beans in tomato sauce, baked with feta","Φασολάκια σε σάλτσα ντομάτας, με φέτα στο φούρνο"],
"Tomaten und Paprika gefüllt mit Reis, Gemüse und Kräutern":["Tomatoes and peppers stuffed with rice, vegetables and herbs","Ντομάτες και πιπεριές γεμιστές με ρύζι, λαχανικά και μυρωδικά"],
"Überbackenes saisonales Gemüse":["Seasonal vegetables baked in the oven","Λαχανικά εποχής στο φούρνο"],
"Hacksteak aus Schwein und Rind, gefüllt mit Feta":["Pork and beef patty filled with feta","Μπιφτέκι από χοιρινό και μοσχάρι, γεμιστό με φέτα"],
"Saftiges Hähnchenbrustfilet vom Grill":["Juicy grilled chicken breast","Ζουμερό στήθος κοτόπουλου σχάρας"],
"Zarte Medaillons in Champignonsauce":["Tender medallions in a mushroom sauce","Απαλά μεδαγιόν με σάλτσα μανιταριών"],
"Zwei traditionelle Spieße vom Grill":["Two traditional grilled skewers","Δύο παραδοσιακά σουβλάκια σχάρας"],
"Auberginenauflauf mit Hackfleisch und Béchamelsauce":["Aubergine bake with minced meat and béchamel","Μουσακάς με κιμά και μπεσαμέλ"],
"Mit grünen Bohnen in Tomatensauce":["With green beans in tomato sauce","Με φασολάκια σε σάλτσα ντομάτας"],
"Gyros mit einem Souvlaki":["Gyros with one souvlaki","Γύρος με ένα σουβλάκι"],
"Gyros, ein Souvlaki und ein Souzuki":["Gyros, one souvlaki and one soutzouki","Γύρος, ένα σουβλάκι και ένα σουτζούκι"],
"Gyros und Bratwurst, dazu Tzatziki und Pommes":["Gyros and sausage, with tzatziki and fries","Γύρος και λουκάνικο, με τζατζίκι και πατάτες"],
"Gegrilltes Lachsfilet":["Grilled salmon fillet","Φιλέτο σολομού σχάρας"],
"Gegrilltes Doradenfilet":["Grilled sea bream fillet","Φιλέτο τσιπούρας σχάρας"],
"Mit Honig und Walnüssen":["With honey and walnuts","Με μέλι και καρύδια"],
"Frisch gezapft":["On tap","Από βαρέλι"],"Griechische Weine (0,2 l)":["Greek wines (0.2 l)","Ελληνικά κρασιά (0,2 l)"],
"Aperitif & Digestif":["Aperitif & digestif","Απεριτίφ & χωνευτικό"],"Kaffee & Alkoholfrei":["Coffee & soft drinks","Καφές & αναψυκτικά"],
"Krombacher Pils 0,3 l":["Krombacher Pils 0.3 l","Krombacher Pils 0,3 l"],"Krombacher Pils 0,5 l":["Krombacher Pils 0.5 l","Krombacher Pils 0,5 l"],
"Starnberger Hell 0,3 l":["Starnberger Hell 0.3 l","Starnberger Hell 0,3 l"],"Starnberger Hell 0,5 l":["Starnberger Hell 0.5 l","Starnberger Hell 0,5 l"],
"Krombacher Weizen 0,5 l":["Krombacher wheat beer 0.5 l","Krombacher Weiss 0,5 l"],
"Imiglikos lieblich (rot/weiß)":["Imiglykos, sweet (red/white)","Ημίγλυκος (κόκκινο/λευκό)"],
"Makedonikos halbtrocken":["Makedonikos, off-dry","Μακεδονικός, ημίξηρος"],
"Ploes Cabernet trocken":["Ploes Cabernet, dry","Ploes Cabernet, ξηρό"],
"Retsina Malamatina":["Retsina Malamatina","Ρετσίνα Μαλαματίνα"],
"Ploes Chardonnay Assyrtiko":["Ploes Chardonnay Assyrtiko","Ploes Chardonnay Ασύρτικο"],
"Volta Rosé trocken":["Volta rosé, dry","Volta ροζέ, ξηρό"],
"Ouzo Loukatos 2 cl":["Ouzo Loukatos 2 cl","Ούζο Λουκάτος 2 cl"],"Ouzo Plomari 2 cl":["Ouzo Plomari 2 cl","Ούζο Πλωμαρίου 2 cl"],
"Aperol Spritz":["Aperol spritz","Aperol spritz"],"Idonilo Tsipouro 0,2 l":["Idonilo tsipouro 0.2 l","Ιδόνιλο τσίπουρο 0,2 l"],
"Metaxa 5 Sterne 2 cl":["Metaxa 5 stars 2 cl","Metaxa 5 αστέρια 2 cl"],"Metaxa 40 Jahre 2 cl":["Metaxa 40 years 2 cl","Metaxa 40 ετών 2 cl"],
"Griechischer Mokka":["Greek coffee","Ελληνικός καφές"],"Christinen Wasser 0,75 l":["Christinen water 0.75 l","Νερό Christinen 0,75 l"],
"Pepsi / 7Up / Schwip Schwap 0,4 l":["Pepsi / 7Up / Schwip Schwap 0.4 l","Pepsi / 7Up / Schwip Schwap 0,4 l"],
"Säfte 0,2 l":["Juices 0.2 l","Χυμοί 0,2 l"]
});
let LANG=localStorage.getItem('zeus-lang')||'de';
const idx={en:0,el:1};
const nodes=[];
(function collect(){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement.closest('script,style')?2:1});let n;while(n=w.nextNode()){const v=n.nodeValue.trim();if(TR[v])nodes.push([n,n.nodeValue,v]);else if(LANG&&DISH_EN[v])nodes.push([n,n.nodeValue,v,'dish'])}})();
function applyLang(l){LANG=l;localStorage.setItem('zeus-lang',l);document.documentElement.lang=l;
 nodes.forEach(([n,orig,key,kind])=>{if(l==='de'){n.nodeValue=orig;return}
  const t=kind==='dish'?(l==='en'?DISH_EN[key]:null):TR[key][idx[l]];n.nodeValue=t?orig.replace(key,t):orig});
 document.querySelectorAll('.ld li button').forEach(b=>b.setAttribute('aria-current',b.dataset.l===l));document.getElementById('ldCur').textContent={de:'DE',en:'EN',el:'ΕΛ'}[l];fillPersons();updateStatus();
 const sub=document.querySelector('#resForm button[type=submit]');
 if(sub&&window.ZeusAuth&&ZeusAuth.configured())sub.textContent=UI[l].send;
 const note=document.getElementById('resNote');
 if(note&&window.ZeusAuth&&ZeusAuth.configured())note.hidden=true;
 const mark=document.querySelector('#confirm .ok');
 if(mark&&mark.textContent==='☎'&&document.getElementById('confirm').style.display==='block')phoneConfirm();}
const ld=document.getElementById('ld'),ldB=document.getElementById('ldBtn');
function ldSet(o){ld.classList.toggle('open',o);ldB.setAttribute('aria-expanded',o)}
ldB.onclick=e=>{e.stopPropagation();ldSet(!ld.classList.contains('open'))};
document.querySelectorAll('.ld li button').forEach(b=>b.onclick=()=>{applyLang(b.dataset.l);ldSet(false)});
document.addEventListener('click',e=>{if(!ld.contains(e.target))ldSet(false)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')ldSet(false)});
function updateStatus(){const s=document.getElementById('status');if(!s)return;const d=new Date(),m=d.getHours()*60+d.getMinutes();s.textContent=d.getDay()===2?UI[LANG].closedT:(m>=1050&&m<1380?UI[LANG].open:UI[LANG].later)}
/* Reservierung (Demo) */
const f=document.getElementById('resForm'),fTime=document.getElementById('fTime'),fPers=document.getElementById('fPers'),fDate=document.getElementById('fDate');
for(let m=17*60+30;m<=22*60;m+=15){const o=document.createElement('option');o.textContent=String(m/60|0).padStart(2,'0')+':'+String(m%60).padStart(2,'0');fTime.append(o)}
fTime.value='19:00';
function fillPersons(){const v=fPers.value||'2';fPers.innerHTML='';for(let i=1;i<=8;i++){const o=document.createElement('option');o.value=i;o.textContent=UI[LANG].pers(i);fPers.append(o)}const o=document.createElement('option');o.value='9+';o.textContent=UI[LANG].big;fPers.append(o);fPers.value=v}
const today=new Date();const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');fDate.min=iso(today);
let first=new Date(today);if(first.getDay()===2)first.setDate(first.getDate()+1);fDate.value=iso(first);
function err(el,msg){el.classList.toggle('invalid',!!msg);el.parentElement.querySelector('.err').textContent=msg||'';return !msg}
function validate(){const U=UI[LANG];let ok=true;
 ok&=err($("fName"),$("fName").value.trim().length<2?U.req:'');
 ok&=err($("fTel"),!/^[+0-9 ()\/-]{6,}$/.test($("fTel").value.trim())?U.tel:'');
 ok&=err($("fMail"),!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test($("fMail").value.trim())?U.mail:'');
 const d=fDate.value?new Date(fDate.value+'T12:00'):null;
 ok&=err(fDate,!d?U.req:(d.getDay()===2?U.tue:(fDate.value<iso(today)?U.past:'')));
 return !!ok}
fDate.addEventListener('change',validate);
['fName','fTel','fMail'].forEach(i=>$(i).addEventListener('input',()=>err($(i),'')));
const resAlert=$('resAlert');
function formMsg(text){resAlert.hidden=!text;resAlert.textContent=text||'';}
function showSummary(){const U=UI[LANG],d=new Date(fDate.value+'T12:00');
 document.getElementById('sum').innerHTML=[[U.sum[0],$("fName").value],[U.sum[1],d.toLocaleDateString(LANG==='el'?'el-GR':LANG==='en'?'en-GB':'de-DE',{weekday:'long',day:'numeric',month:'long',year:'numeric'})],[U.sum[2],fTime.value],[U.sum[3],fPers.options[fPers.selectedIndex].text]].map(([a,b])=>`<dt>${a}</dt><dd>${b.replace(/</g,'&lt;')}</dd>`).join('');
 document.getElementById('formBody').style.display='none';document.getElementById('confirm').style.display='block';}
const phoneKey="Online-Reservierung folgt in Kürze – bitte reservieren Sie telefonisch:";
function phoneConfirm(){const phrase=LANG==='de'?phoneKey:TR[phoneKey][idx[LANG]];
 $('confirm').querySelector('p').innerHTML=phrase+' <a href="tel:+495483749534" style="white-space:nowrap">05483 749534</a>';}
function confirmMode(booked,tables){const mark=$('confirm').querySelector('.ok');
 if(!booked){mark.textContent='☎';phoneConfirm();return;}
 mark.textContent='✓';$('confirm').querySelector('p').textContent=UI[LANG].booked(tables||'');}
f.addEventListener('submit',async e=>{e.preventDefault();formMsg('');if(!validate())return;
 const U=UI[LANG];
 if(fPers.value==='9+'){err(fPers,U.bigCall);return;}
 const live=window.ZeusAuth&&ZeusAuth.configured();
 if(!live){confirmMode(false);showSummary();return;}
 const btn=f.querySelector('button[type=submit]');btn.disabled=true;
 try{
  const data=await ZeusAuth.call({action:'reserve',name:$('fName').value.trim(),tel:$('fTel').value.trim(),email:$('fMail').value.trim(),date:fDate.value,time:fTime.value,persons:Number(fPers.value),message:$('fMsg').value.trim(),lang:LANG,company:$('fCompany').value});
  if(!data.ok){formMsg(data.error==='full'?U.full:data.error==='rate_limited'?U.rate:data.error==='not_configured'?U.down:U.fail);return;}
  confirmMode(true,data.tables);showSummary();
 }catch(err){formMsg(U.down);}
 finally{btn.disabled=false;}
});
document.getElementById('again').onclick=()=>{f.reset();fDate.value=iso(first);fTime.value='19:00';fillPersons();$('fCompany').value='';formMsg('');confirmMode(false);document.getElementById('formBody').style.display='';document.getElementById('confirm').style.display='none'};
fillPersons();applyLang(LANG);
