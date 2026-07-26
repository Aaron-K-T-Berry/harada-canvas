export function SkipLink() {
  return (
    <button
      type="button"
      className="skip-link"
      onClick={() => {
        const main = document.getElementById("main-content");
        if (!main) {
          return;
        }
        main.focus();
        main.scrollIntoView();
      }}
    >
      Skip to main content
    </button>
  );
}
