// ---- Config ----
const GOOGLE_API_KEY = "AIzaSyBjLIsXQhnnnTTD-4Ps1CLr-H-ayZqxmoE"; // vervang met je echte key
const EMAILJS_SERVICE_ID = "service_6wydmsm"; // jouw service id
const EMAILJS_TEMPLATE_ADMIN = "template_4k6zi6a";        // admin template id
const EMAILJS_TEMPLATE_CLIENT = "template_4k6zi6a";       // klant template id

// ---- Helpers ----
function debounce(fn, delay = 400) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// Geocode een adres naar { lat, lng }
async function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;

  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.status === "OK" && data.results[0]?.geometry?.location) {
      return data.results[0].geometry.location;
    }
    console.warn("Geocoding status:", data.status, data.error_message || "");
    return null;
  } catch (e) {
    console.error("Geocoding fetch error:", e);
    return null;
  }
}

// Haversine afstand (km)
function berekenAfstand(coord1, coord2) {
  const R = 6371;
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(coord1.lat * Math.PI / 180) *
    Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---- PlaceAutocompleteElement init + fallback ----
function initAutocomplete() {
  const pickupInput = document.getElementById("pickup");
  const deliveryInput = document.getElementById("delivery");

  // Feature detectie voor PlaceAutocompleteElement
  const hasPAE = !!(window.google && google.maps && google.maps.places && google.maps.places.PlaceAutocompleteElement);

  if (hasPAE) {
    try {
      const pickupPAE = new google.maps.places.PlaceAutocompleteElement({ inputElement: pickupInput });
      const deliveryPAE = new google.maps.places.PlaceAutocompleteElement({ inputElement: deliveryInput });

      // Wanneer gebruiker een plaats kiest, zet de nette formatted address terug in het inputveld
      const setSelectedAddress = (pae, inputEl) => {
        pae.addEventListener("place_changed", () => {
          const place = pae.value; // PlaceResult of string afhankelijk van selectie
          // Als value een object is met structured_formatting/ formatted_address:
          if (place && typeof place === "object") {
            inputEl.value = place.formattedAddress || place.formatted_address || inputEl.value;
          }
        });
      };

      setSelectedAddress(pickupPAE, pickupInput);
      setSelectedAddress(deliveryPAE, deliveryInput);
    } catch (e) {
      console.warn("PlaceAutocompleteElement init faalde, val terug op plain inputs:", e);
      // Geen verdere actie nodig; geocoding-validatie vangt dit op.
    }
  } else {
    console.warn("PlaceAutocompleteElement niet beschikbaar; gebruik plain inputs + geocoding-validatie.");
  }
}

// ---- Prijsberekening met fallback ----
async function calculatePrice() {
  const pickup = document.getElementById("pickup").value.trim();
  const delivery = document.getElementById("delivery").value.trim();
  const vehicle = document.getElementById("vehicle").value;

  if (!pickup || !delivery || !vehicle) return;

  try {
    const [pickupCoord, deliveryCoord] = await Promise.all([
      geocodeAddress(pickup),
      geocodeAddress(delivery)
    ]);

    if (!pickupCoord || !deliveryCoord) throw new Error("Geocoding mislukt");

    const afstandKm = berekenAfstand(pickupCoord, deliveryCoord);

    const prijsPerKm =
      vehicle === "auto" ? 0.75 :
      vehicle === "bestelauto" ? 1.10 :
      vehicle === "bus" ? 1.50 : 0;

    const prijs = Math.round(afstandKm * prijsPerKm * 100) / 100;
    document.getElementById("priceEstimate").textContent = `€${prijs.toFixed(2)}`;
  } catch (err) {
    console.error("❌ Fout bij prijsberekening:", err);
    const fallbackPrijs = 25.00;
    document.getElementById("priceEstimate").textContent =
      `vanaf €${fallbackPrijs.toFixed(2)} (exacte prijs volgt)`;
  }
}

const debouncedCalculate = debounce(calculatePrice, 500);

// ---- Formulierverwerking + EmailJS ----
function initBookingForm() {
  const form = document.getElementById("bookingForm");

  // Live prijs bij wijzigingen
  ["pickup", "delivery", "vehicle"].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener("input", debouncedCalculate);
    el.addEventListener("change", calculatePrice);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const pickup = document.getElementById("pickup").value.trim();
    const delivery = document.getElementById("delivery").value.trim();
    const vehicle = document.getElementById("vehicle").value;
    const datetime = document.getElementById("datetime").value;
    const email = document.getElementById("email").value.trim();
    const notes = document.getElementById("notes").value.trim();
    const price = document.getElementById("priceEstimate").textContent;

    if (!name || !pickup || !delivery || !vehicle || !datetime || !email) {
      alert("Vul alle verplichte velden in.");
      return;
    }

    // Zorg dat je tenminste coördinaten hebt bij submit (stiltegevallen suggestie/caching)
    const [pickupCoord, deliveryCoord] = await Promise.all([
      geocodeAddress(pickup),
      geocodeAddress(delivery)
    ]);

    const templateParams = {
      name, pickup, delivery, vehicle, datetime, email, notes, price,
      pickup_lat: pickupCoord?.lat ?? "",
      pickup_lng: pickupCoord?.lng ?? "",
      delivery_lat: deliveryCoord?.lat ?? "",
      delivery_lng: deliveryCoord?.lng ?? ""
    };

    try {
      // Admin-notificatie
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ADMIN, templateParams);
      // Klantbevestiging
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_CLIENT, templateParams);

      alert("✅ Je aanvraag is verstuurd!");
      form.reset();
      document.getElementById("priceEstimate").textContent = "€0,00";
    } catch (err) {
      console.error("❌ Fout bij versturen:", err);
      alert("Er ging iets mis bij het versturen. Probeer het opnieuw.");
    }
  });
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  initBookingForm();
  initAutocomplete();
});
