# Fundament Console

## Decyzje

- Zachowujemy stack startera GI: React 19, TypeScript, React Router w trybie SPA, Vite, Athena. Brak backendu i nowych zależności runtime.
- Athena dostarcza Button, Badge, Input, TextArea i InfoMessage oraz tokeny kolorów. Layout powłoki jest lokalny. Ewentualne uogólnienie do Atheny nastąpi po sprawdzeniu na kolejnych modułach.
- Fonty Poppins 600 i Roboto są hostowane razem z aplikacją. Eksport jawnie czeka na ich wczytanie. Pliki i licencje OFL pochodzą z google/fonts.
- Canvas 2D tworzy PNG, które jest jednocześnie podglądem i plikiem do pobrania. Unikamy rasteryzacji DOM, zależności od CSS przeglądarki i SVG foreignObject. Różnice rasteryzacji fontów między systemami nadal wymagają oceny wzrokowej.
- Generujemy formaty kolejno, zwalniamy canvasy i unieważniamy nieaktualne adresy blob. Asynchroniczny wynik starszej edycji nie zastępuje nowszej.
- Natywne udostępnianie dostaje wcześniej przygotowany File bez oczekiwania na render po kliknięciu. Wykrywanie funkcji i pobieranie PNG zapewniają fallback. System decyduje, które aplikacje przyjmą plik.
- Publiczny POC nie udaje kontroli dostępu. Przed ograniczeniem dostępu należy dodać bramkę SSO na hostingu, połączoną z istniejącym dostawcą tożsamości GI, i sprawdzić odmowę dostępu dla osoby spoza organizacji. Ukrycie linku ani `noindex` nie są zabezpieczeniem.

## Dodanie niezależnego modułu

1. Dodaj `src/modules/<nazwa>/module.ts` z domyślnym eksportem typu `ConsoleModule` (name, path, description, order).
2. Dodaj widok w `src/components/<domena>/<ComponentName>/<ComponentName>.tsx`.
3. Dodaj cienki plik routingu w `src/pages/<nazwa>.tsx` eksportujący widok.
4. Dodaj testy w `e2e/<domena>` i dokumentację modułu.

Powłoka odkrywa manifesty przez `import.meta.glob`, a router strony przez `flatRoutes`. Nie edytujesz Marketingu ani istniejących wpisów nawigacji. Ścieżki modułów muszą być unikalne. Dane domenowe zostają w komponencie/domenie; współdzielone typy w `src/types` zgodnie ze standardami GI.

`ExportLab` jest wydzieloną próbą techniczną. Jego layout i limity są demonstracyjne; nie stanowią rejestru produkcyjnych szablonów ani końcowego standardu GI.
