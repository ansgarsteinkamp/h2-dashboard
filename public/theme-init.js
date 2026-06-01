(() => {
   const storageKey = "h2-dashboard-ui-theme";
   let theme = "dark";

   try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (storedTheme === "light" || storedTheme === "dark") {
         theme = storedTheme;
      }
   } catch {
      theme = "dark";
   }

   document.documentElement.classList.remove("light", "dark");
   document.documentElement.classList.add(theme);
   document.documentElement.style.colorScheme = theme;
})();
