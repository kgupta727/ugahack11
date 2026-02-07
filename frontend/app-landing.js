const themeToggle = document.getElementById("themeToggle");

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  if (themeToggle) {
    themeToggle.textContent = theme === "light" ? "Dark Mode" : "Light Mode";
  }
  localStorage.setItem("nexus-theme", theme);
};

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "dark";
    setTheme(current === "dark" ? "light" : "dark");
  });
}

const savedTheme = localStorage.getItem("nexus-theme");
setTheme(savedTheme || "dark");
