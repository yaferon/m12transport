const prijsPerKm = {
  auto: 0.50,
  bestelauto: 0.75,
  bus: 1.00
};

const startTarief = 25;
const spoedToeslag = 1.25;

function berekenPrijs() {
  const pickup = document.getElementById("pickup").value;
  const delivery = document.getElementById("delivery").value;
  const voertuig = document.getElementById("vehicle").value;

  if (!pickup || !delivery || !voertuig) return;

  const service = new google.maps.DistanceMatrixService();

  service.getDistanceMatrix({
    origins: [pickup],
    destinations: [delivery],
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC,
  }, function(response, status) {
    if (status !== "OK") {
      document.getElementById("priceEstimate").textContent = "Prijsberekening mislukt";
      return;
    }

    const afstandMeters = response.rows[0].elements[0].distance?.value;
    if (!afstandMeters) {
      document.getElementById("priceEstimate").textContent = "Geen afstand gevonden";
      return;
    }

    const afstandKm = afstandMeters / 1000;
    const kmPrijs = afstandKm * prijsPerKm[voertuig];
    const totaal = (startTarief + kmPrijs) * spoedToeslag;

    document.getElementById("priceEstimate").textContent = `€${totaal.toFixed(2)}`;
  });
}

function initBookingForm() {
  const name = document.getElementById("name").value;
  const pickup = document.getElementById("pickup");
  const delivery = document.getElementById("delivery");
  const vehicle = document.getElementById("vehicle");
  const datetime = document.getElementById("datetime");
  const email = document.getElementById("email");
  const form = document.getElementById("bookingForm");

  new google.maps.places.Autocomplete(pickup);
  new google.maps.places.Autocomplete(delivery);

  pickup.addEventListener("blur", berekenPrijs);
  delivery.addEventListener("blur", berekenPrijs);
  vehicle.addEventListener("change", berekenPrijs);

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    if (!pickup.value || !delivery.value || !vehicle.value || !datetime.value || !email.value) {
      alert("Vul alle velden in.");
      return;
    }

   const templateParams = {
  name: document.getElementById("name").value,
  pickup: document.getElementById("pickup").value,
  delivery: document.getElementById("delivery").value,
  vehicle: document.getElementById("vehicle").value,
  datetime: document.getElementById("datetime").value,
  email: document.getElementById("email").value,
  notes: document.getElementById("notes").value
};




    // ✅ Verstuur bevestiging direct
    emailjs.send("service_6wydmsm", "template_pkf6uuc", templateParams)
      .then(() => console.log("✅ Bevestiging verstuurd"))
      .catch((err) => console.error("❌ Fout bij bevestiging:", err));

    // ✅ Herinnering 1 uur vóór rit
    const pickupTime = new Date(datetime.value);
    const now = new Date();
    const msUntilReminder = pickupTime - now - (60 * 60 * 1000); // 1 uur

    if (msUntilReminder > 0) {
      setTimeout(() => {
        emailjs.send("service_6wydmsm", "template_pkf6uuc", templateParams)
          .then(() => console.log("📩 Herinnering verstuurd"))
          .catch((err) => console.error("❌ Fout bij herinnering:", err));
      }, msUntilReminder);
    }

    alert("✅ Aanvraag verstuurd!");
    form.reset();
    document.getElementById("priceEstimate").textContent = "€0,00";
    window.location.href = "bevestiging.html";
  });
}

document.addEventListener("DOMContentLoaded", initBookingForm);
