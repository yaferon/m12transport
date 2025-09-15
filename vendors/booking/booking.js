const prijsPerKm = {
  auto: 0.50,
  bestelauto: 0.75,
  bus: 1.00
};

const startTarief = 25; // vaste kosten per rit
const spoedToeslag = 1.25; // 25% extra voor spoedritten

async function berekenPrijs() {
  const pickup = document.getElementById("pickup").value;
  const delivery = document.getElementById("delivery").value;
  const voertuig = document.getElementById("vehicle").value;

  if (!pickup || !delivery || !voertuig) return;

  const apiKey = "AIzaSyBjLIsXQhnnnTTD-4Ps1CLr-H-ayZqxmoE"; // ← vervang met je eigen key
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(pickup)}&destinations=${encodeURIComponent(delivery)}&key=${apiKey}`;
  const proxy = "https://api.allorigins.win/raw?url=";

  try {
    const response = await fetch(proxy + encodeURIComponent(url));
    const data = await response.json();

    const afstandMeters = data.rows?.[0]?.elements?.[0]?.distance?.value;
    if (!afstandMeters) throw new Error("Geen afstand gevonden");

    const afstandKm = afstandMeters / 1000;
    const kmPrijs = afstandKm * prijsPerKm[voertuig];
    const totaalZonderToeslag = startTarief + kmPrijs;
    const totaalMetToeslag = totaalZonderToeslag * spoedToeslag;

    document.getElementById("priceEstimate").textContent = `€${totaalMetToeslag.toFixed(2)}`;
  } catch (err) {
    console.error("Prijsberekening mislukt:", err);
    document.getElementById("priceEstimate").textContent = "Prijsberekening mislukt";
  }
}

function initBookingForm() {
  const form = document.getElementById("bookingForm");
  const pickup = document.getElementById("pickup");
  const delivery = document.getElementById("delivery");
  const vehicle = document.getElementById("vehicle");

  pickup.addEventListener("blur", berekenPrijs);
  delivery.addEventListener("blur", berekenPrijs);
  vehicle.addEventListener("change", berekenPrijs);

  form.addEventListener("submit", function(e) {
    e.preventDefault();
    alert("✅ Bedankt! Je aanvraag is ontvangen.");
    form.reset();
    document.getElementById("priceEstimate").textContent = "€0,00";
  });
}

document.addEventListener("DOMContentLoaded", initBookingForm);
