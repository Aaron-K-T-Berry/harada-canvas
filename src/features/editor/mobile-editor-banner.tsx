import { Button } from "@/components/ui/button";

interface MobileEditorBannerProps {
  editingEnabled: boolean;
  onEnableEditing: () => void;
  onDisableEditing: () => void;
}

export function MobileEditorBanner({
  editingEnabled,
  onEnableEditing,
  onDisableEditing,
}: MobileEditorBannerProps) {
  return (
    <section
      aria-label="Mobile editing mode"
      className="rounded-lg border border-border bg-secondary/60 px-4 py-3 text-secondary-foreground"
    >
      {editingEnabled ? (
        <>
          <p className="text-sm">
            Editing is on for this small screen. Desktop browsers give the fullest keyboard and grid
            experience.
          </p>
          <div className="mt-3">
            <Button type="button" size="sm" variant="outline" onClick={onDisableEditing}>
              Return to viewing
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">
            This device is in a simplified viewing mode. Open squares to review them here; use a
            larger screen for the complete editing experience.
          </p>
          <div className="mt-3">
            <Button type="button" size="sm" onClick={onEnableEditing}>
              Enable editing on this device
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
