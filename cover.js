const coverScreen = document.querySelector("#coverScreen");
const startButton = document.querySelector("#startButton");
const appShell = document.querySelector(".app-shell");

function openAppShell() {
  coverScreen?.classList.add("hidden");
  appShell?.classList.remove("hidden");
  coverScreen?.setAttribute("aria-hidden", "true");
  appShell?.removeAttribute("aria-hidden");
}

if (startButton) {
  startButton.addEventListener("click", openAppShell);
}

if (coverScreen) {
  coverScreen.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      openAppShell();
    }
  });
}
