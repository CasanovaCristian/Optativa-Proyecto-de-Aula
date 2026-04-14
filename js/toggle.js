document.addEventListener("click", (e) => {
  const toggle = e.target.closest(".toggle-password");
  if (!toggle) return;

  const targetId = toggle.getAttribute("data-target");
  const input = document.getElementById(targetId);
  if (!input) return;

  const isPassword = input.type === "password";
  input.type = isPassword ? "text" : "password";

  // Alternar clases de icono (si aplica)
  toggle.classList.toggle("fa-eye");
  toggle.classList.toggle("fa-eye-slash");
});
