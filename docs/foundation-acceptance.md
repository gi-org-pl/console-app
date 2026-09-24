# Etap 1: demonstracja i akceptacja

Ten etap dostarcza powłokę Console i eksperyment eksportu, nie Marketing MVP.
POC jest publiczny zgodnie z briefem. Nie ma logowania, bazy, backendu ani wysyłania zdjęć na serwer.
Oznaczenia „gi” w powłoce i układ testowy są tymczasowe. Nie zastępują dostarczonych później plików logo i standardu grafik.

## Scenariusz demonstracji (około 2 minuty)

1. Otwórz pulpit i przejdź do Marketingu.
2. Zmień nagłówek na „Zażółć gęślą jaźń”. Zobacz wszystkie cztery formaty.
3. Dodaj lokalne zdjęcie JPG, PNG lub WebP i przesuń punkt kadrowania.
4. Pobierz PNG. Porównaj podgląd i zapisany obraz, sprawdź rozmiar.
5. Na telefonie przez HTTPS wybierz „Udostępnij” i sprawdź odbiór pliku w docelowej aplikacji.
6. Wpisz ponad 90 znaków albo bardzo długie słowo. Eksport znika, pojawia się komunikat zamiast przyciętej treści.

## Kryteria zamknięcia etapu

Weryfikacja automatyczna 24.09.2026: 16/16 testów Playwright (Chromium, Firefox, WebKit, mobilny WebKit), dodatkowo 4/4 testy Chromium dla builda pod `/console-app/`. Sprawdzone: bajtowa zgodność podglądu z pobranym PNG, sygnatura i rozmiary wszystkich formatów, polskie znaki, kadrowanie na obrazie kontrolnym, błędny plik, brak fontów, przepełnienie, share podczas aktywnego gestu i brak poziomego scrollowania. Build, TypeScript, lint i 6 istniejących testów jednostkowych przechodzą.

- [ ] Zespół akceptuje wygląd i nawigację Console.
- [ ] Publiczny adres HTTPS działa, także po odświeżeniu `/marketing`.
- [ ] Logo i materiały marki są przekazane lub termin ich dostarczenia jest uzgodniony.
- [ ] Rzeczywisty iPhone: Safari, zdjęcie z aparatu, kadrowanie, cztery PNG, polskie litery.
- [ ] Rzeczywisty iPhone: „Udostępnij”, anulowanie i ponowienie, odbiór w Instagramie/LinkedIn.
- [ ] Android: Chrome, pobranie i natywne udostępnianie.
- [ ] Akceptacja przejścia do etapu 2.

Playwright WebKit (także profil iPhone) sprawdza silnik i viewport, nie rzeczywisty iOS, pamięć telefonu ani integrację systemowego arkusza udostępniania. Test share mockuje API i dowodzi przekazania gotowego pliku podczas aktywnego gestu, nie publikacji w aplikacji. Niewykonane próby urządzeń pozostają otwarte — ryzyko iOS nie jest jeszcze zamknięte.

## Etap 2 po akceptacji

Pierwszy zatwierdzony szablon jako wzorzec, następnie Cytat, Wydarzenie i Rekrutacja; opis posta z limitami platform, hashtagi i stopki, ZIP wszystkich formatów z opisem, kopiowanie i automatyczne szkice lokalne. Standard marki musi obejmować układy, paletę, logo i reguły długości tekstu. Dodawanie produkcyjnego szablonu opiszemy na podstawie zatwierdzonego wzorca.

Publikowanie, akceptacje i pośrednik pozostają etapem 4 po osobnej decyzji zarządu.
