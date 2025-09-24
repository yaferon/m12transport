// --- Google Autocomplete ---
 function initAutocomplete() {
  const pickupInput = document.getElementById("pickup");
  const deliveryInput = document.getElementById("delivery");

  if (pickupInput && deliveryInput && window.google && google.maps.places) {
    new google.maps.places.Autocomplete(pickupInput);
    new google.maps.places.Autocomplete(deliveryInput);
  }
}

// --- Geocoding ---
async function geocodeAddress(address) {
  const apiKey = "AIzaSyBjLIsXQhnnnTTD-4Ps1CLr-H-ayZqxmoE"; // vervang met je echte Google API key
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === "OK") {
    return data.results[0].geometry.location; // { lat, lng }
  } else {
    console.warn("Geocoding mislukt:", address, data.status);
    return null;
  }
}


// --- Haversine afstand ---
function berekenAfstand(coord1, coord2) {
  const R = 6371; // km
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

// --- Prijsberekening ---
async function calculatePrice() {
  const pickup = document.getElementById("pickup").value;
  const delivery = document.getElementById("delivery").value;
  const vehicle = document.getElementById("vehicle").value;

  if (!pickup || !delivery || !vehicle) return;

  const pickupCoord = await geocodeAddress(pickup);
  const deliveryCoord = await geocodeAddress(delivery);

  if (!pickupCoord || !deliveryCoord) {
    document.getElementById("priceEstimate").textContent = "€0,00";
    return;
  }

  const afstandKm = berekenAfstand(pickupCoord, deliveryCoord);

  const prijsPerKm =
    vehicle === "auto" ? 0.75 :
    vehicle === "bestelauto" ? 1.10 :
    vehicle === "bus" ? 1.50 : 0;

  const prijs = Math.round(afstandKm * prijsPerKm * 100) / 100;
  document.getElementById("priceEstimate").textContent = `€${prijs.toFixed(2)}`;
}

// --- Formulierverwerking ---
function initBookingForm() {
  const form = document.getElementById("bookingForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const pickup = document.getElementById("pickup").value;
    const delivery = document.getElementById("delivery").value;
    const vehicle = document.getElementById("vehicle").value;
    const datetime = document.getElementById("datetime").value;
    const email = document.getElementById("email").value;
    const notes = document.getElementById("notes").value;
    const price = document.getElementById("priceEstimate").textContent;

    if (!name || !pickup || !delivery || !vehicle || !datetime || !email) {
      alert("Vul alle verplichte velden in.");
      return;
    }

    const templateParams = {
      name,
      pickup,
      delivery,
      vehicle,
      datetime,
      email,
      notes,
      price
    };

    try {
      // ✅ Mail naar jou (admin)
      await emailjs.send("service_m12transport", "rit_admin", templateParams);

      // ✅ Mail naar klant (bevestiging)
      await emailjs.send("service_m12transport", "rit_klant", templateParams);

      alert("✅ Je aanvraag is verstuurd!");
      form.reset();
      document.getElementById("priceEstimate").textContent = "€0,00";
    } catch (err) {
      console.error("❌ Fout bij versturen:", err);
      alert("Er ging iets mis bij het versturen. Probeer het opnieuw.");
    }
  });

  // Trigger prijsberekening bij input
  ["pickup", "delivery", "vehicle"].forEach(id => {
    document.getElementById(id).addEventListener("change", calculatePrice);
  });
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  initBookingForm();
  initAutocomplete();
});
