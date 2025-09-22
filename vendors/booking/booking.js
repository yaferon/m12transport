// Activeer Google Maps Autocomplete
function initAutocomplete() {
  const pickupInput = document.getElementById("pickup");
  const deliveryInput = document.getElementById("delivery");

  if (pickupInput && deliveryInput && window.google && google.maps.places) {
    new google.maps.places.Autocomplete(pickupInput);
    new google.maps.places.Autocomplete(deliveryInput);
  } else {
    console.warn("Google Maps Autocomplete is niet beschikbaar.");
  }
}

// Bereken prijs op basis van afstand en voertuigtype
async function calculatePrice() {
  const pickup = document.getElementById("pickup").value;
  const delivery = document.getElementById("delivery").value;
  const vehicle = document.getElementById("vehicle").value;

  if (!pickup || !delivery || !vehicle) return;

  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(pickup)}&destinations=${encodeURIComponent(delivery)}&key=JOUW_API_KEY`);
    const data = await response.json();

    const meters = data.rows[0].elements[0].distance.value;
    const km = meters / 1000;

    let rate = 0;
    if (vehicle === "auto") rate = 0.75;
    if (vehicle === "bestelauto") rate = 1.10;
    if (vehicle === "bus") rate = 1.50;

    const price = Math.round(km * rate * 100) / 100;
    document.getElementById("priceEstimate").textContent = `€${price.toFixed(2)}`;
  } catch (err) {
    console.error("❌ Fout bij prijsberekening:", err);
    document.getElementById("priceEstimate").textContent = "€0,00";
  }
}

// Verwerk formulier en verstuur via EmailJS
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
      notes
    };

    try {
      await emailjs.send("service_6wydmsm", "template_4k6zi6a", templateParams);
      console.log("✅ Bevestiging verstuurd");
      alert("✅ Je aanvraag is verstuurd!");
      form.reset();
      document.getElementById("priceEstimate").textContent = "€0,00";
      window.location.href = "bevestiging.html"; // optioneel
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

// Init alles zodra DOM geladen is
document.addEventListener("DOMContentLoaded", () => {
  initBookingForm();
  initAutocomplete();
});
