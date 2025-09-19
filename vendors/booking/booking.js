// Tarieven per voertuigtype
const prijsPerKm = {
  auto: 0.60,
  bestelauto: 0.80,
  bus: 1.20
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
      console.error("DistanceMatrix error:", status);
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
    const totaalZonderToeslag = startTarief + kmPrijs;
    const totaalMetToeslag = totaalZonderToeslag * spoedToeslag;

    document.getElementById("priceEstimate").textContent = `€${totaalMetToeslag.toFixed(2)}`;
  });
}

function initBookingForm() {
  const form = document.getElementById("bookingForm");
  const pickup = document.getElementById("pickup");
  const delivery = document.getElementById("delivery");
  const vehicle = document.getElementById("vehicle");

  // Autocomplete toevoegen aan adresvelden
  const autocompletePickup = new google.maps.places.Autocomplete(pickup);
  const autocompleteDelivery = new google.maps.places.Autocomplete(delivery);

  // Bereken prijs bij invoer
  pickup.addEventListener("blur", berekenPrijs);
  delivery.addEventListener("blur", berekenPrijs);
  vehicle.addEventListener("change", berekenPrijs);

  // Verwerking bij verzenden
  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const pickupVal = pickup.value;
    const deliveryVal = delivery.value;
    const vehicleVal = vehicle.value;

    if (!pickupVal || !deliveryVal || !vehicleVal) {
      alert("Vul alle verplichte velden in.");
      return;
    }

    alert("✅ Bedankt! Je aanvraag is ontvangen.");
    form.reset();
    document.getElementById("priceEstimate").textContent = "€0,00";

    // Doorsturen naar bevestigingspagina
    window.location.href = "bevestiging.html";
  });
}

document.addEventListener("DOMContentLoaded", initBookingForm);
