import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Inbox, RefreshCw, Save, Users } from "lucide-react";

type IntakeStatus = "new" | "reviewing" | "contacted" | "matched" | "closed";

interface Intake {
  id: string;
  workflowId: string;
  workflowTitle: string;
  data: Record<string, unknown>;
  status?: IntakeStatus;
  notes?: string;
  assignedLawyerId?: string | null;
  completedAt?: string;
  updatedAt?: string;
}

const LOCAL_SESSION_KEY = "lexy.workflow.session.v1";
const statuses: IntakeStatus[] = ["new", "reviewing", "contacted", "matched", "closed"];

function readLocalLexySession(): Intake[] {
  const saved = window.localStorage.getItem(LOCAL_SESSION_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as {
      selectedWorkflowId?: string;
      formData?: Record<string, unknown>;
      updatedAt?: string;
    };

    if (!parsed.selectedWorkflowId || !parsed.formData || Object.keys(parsed.formData).length === 0) {
      return [];
    }

    return [{
      id: "local-draft",
      workflowId: parsed.selectedWorkflowId,
      workflowTitle: parsed.selectedWorkflowId.replaceAll("_", " ").replaceAll(".", " / "),
      data: parsed.formData,
      status: "new",
      notes: "",
      completedAt: parsed.updatedAt,
      updatedAt: parsed.updatedAt,
    }];
  } catch {
    return [];
  }
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function AdminIntakeCard({ intake, onSaved }: { intake: Intake; onSaved: () => void }) {
  const [status, setStatus] = useState<IntakeStatus>(intake.status || "new");
  const [notes, setNotes] = useState(intake.notes || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canSave = intake.id !== "local-draft";

  const save = async () => {
    if (!canSave) {
      setMessage("Local drafts become editable after they are submitted to the server.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/intakes/${intake.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) throw new Error("Could not save intake");
      setMessage("Saved");
      onSaved();
    } catch {
      setMessage("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>{intake.workflowTitle}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{intake.workflowId}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{intake.updatedAt ? new Date(intake.updatedAt).toLocaleString() : "Draft"}</Badge>
            <Badge>{status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-[180px_1fr_auto] md:items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as IntakeStatus)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {statuses.map((statusOption) => (
                <option key={statusOption} value={statusOption}>{statusOption}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin notes</label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Next step, follow-up notes, lawyer fit, etc."
              rows={2}
            />
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {message && <p className="text-sm text-muted-foreground">{message}</p>}

        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(intake.data || {}).slice(0, 10).map(([key, value]) => (
            <div key={key} className="rounded-md border bg-secondary/30 p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground">{key.replaceAll("_", " ")}</div>
              <div className="mt-1 truncate text-sm">{stringifyValue(value)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function Admin() {
  const localDrafts = useMemo(readLocalLexySession, []);

  const { data: serverIntakes = [], isLoading, error, refetch } = useQuery<Intake[]>({
    queryKey: ["/api/intakes"],
    queryFn: async () => {
      const response = await fetch("/api/intakes");
      if (!response.ok) {
        throw new Error("Intake API unavailable");
      }
      return response.json();
    },
  });

  const intakes = serverIntakes.length > 0 ? serverIntakes : localDrafts;
  const totalAnswers = intakes.reduce((count, intake) => count + Object.keys(intake.data || {}).length, 0);
  const openIntakes = intakes.filter((intake) => (intake.status || "new") !== "closed").length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin</h1>
          <p className="mt-2 text-muted-foreground">Review Lexy submissions, track follow-up, and keep notes.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Inbox className="h-4 w-4" />
              Open intakes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{openIntakes}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FileText className="h-4 w-4" />
              Answers collected
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totalAnswers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Data source
            </CardTitle>
          </CardHeader>
          <CardContent className="text-base font-semibold">
            {serverIntakes.length > 0 ? "Server" : localDrafts.length > 0 ? "Local draft" : "Server ready"}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The server API is unavailable in this browser session, so Admin is showing saved local Lexy drafts when present.
        </div>
      )}

      <div className="space-y-4">
        {isLoading && <p className="text-muted-foreground">Loading intakes...</p>}

        {!isLoading && intakes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No Lexy submissions yet.
            </CardContent>
          </Card>
        )}

        {intakes.map((intake) => (
          <AdminIntakeCard key={intake.id} intake={intake} onSaved={refetch} />
        ))}
      </div>
    </div>
  );
}
