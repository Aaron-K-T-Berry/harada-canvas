import { type FormEvent, useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameSquareDialogProps {
  open: boolean;
  initialTitle: string;
  onOpenChange: (open: boolean) => void;
  onRename: (title: string) => void;
}

export function RenameSquareDialog({
  open,
  initialTitle,
  onOpenChange,
  onRename,
}: RenameSquareDialogProps) {
  const inputId = useId();
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setError(null);
    }
  }, [initialTitle, open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Enter a title for this square.");
      return;
    }
    onRename(nextTitle);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Rename square</DialogTitle>
            <DialogDescription>Choose a clear name you will recognize later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={inputId}>Title</Label>
            <Input
              id={inputId}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError(null);
              }}
              autoFocus
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${inputId}-error` : undefined}
            />
            {error ? (
              <p id={`${inputId}-error`} className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save title</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
