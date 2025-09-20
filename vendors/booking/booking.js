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
  const form = document.getElementById("bookingForm");

  form.addEventListener("submit", function(e) {
    e.preventDefault(); // ✅ voorkomt herladen of GitHub Pages trigger

    // Haal alle formulierwaarden op
    const name = document.getElementById("name").value;
    const pickup = document.getElementById("pickup").value;
    const delivery = document.getElementById("delivery").value;
    const vehicle = document.getElementById("vehicle").value;
    const datetime = document.getElementById("datetime").value;
    const email = document.getElementById("email").value;
    const notes = document.getElementById("notes").value;

    // Validatie (optioneel, maar handig)
    if (!name || !pickup || !delivery || !vehicle || !datetime || !email) {
      alert("Vul alle verplichte velden in.");
      return;
    }

    // Bouw templateParams voor EmailJS
    const templateParams = {
      name: name,
      pickup: pickup,
      delivery: delivery,
      vehicle: vehicle,
      datetime: datetime,
      email: email,
      notes: notes
    };

    // Verstuur via EmailJS
    emailjs.send("service_m12transport", "rit_bevestiging", templateParams)
      .then(() => {
        console.log("✅ Bevestiging verstuurd");
        alert("✅ Je aanvraag is verstuurd!");
        form.reset();
        document.getElementById("priceEstimate").textContent = "€0,00";
        window.location.href = "bevestiging.html"; // optioneel
      })
      .catch((err) => {
        console.error("❌ Fout bij versturen:", err);
        alert("Er ging iets mis bij het versturen. Probeer het opnieuw.");
      });
  });
}

document.addEventListener("DOMContentLoaded", initBookingForm);

