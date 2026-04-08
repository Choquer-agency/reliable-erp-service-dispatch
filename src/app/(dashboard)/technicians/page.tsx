"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Doc } from "../../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, Link2, Plus, Pencil, UserX } from "lucide-react";
import { LinkAccountDialog } from "@/components/technicians/LinkAccountDialog";
import { TechnicianFormDialog } from "@/components/technicians/TechnicianFormDialog";
import { DeactivateDialog } from "@/components/technicians/DeactivateDialog";
import { formatPhone } from "@/lib/phoneFormat";

export default function TechniciansPage() {
  const technicians = useQuery(api.technicians.list, {});
  const activeCallCounts = useQuery(api.technicians.getActiveCallCounts, {});

  const [showInactive, setShowInactive] = useState(false);
  const [linkingTech, setLinkingTech] = useState<{
    id: Id<"technicians">;
    name: string;
  } | null>(null);
  const [formDialog, setFormDialog] = useState<{
    mode: "add" | "edit";
    technician?: Doc<"technicians">;
  } | null>(null);
  const [deactivating, setDeactivating] = useState<{
    id: Id<"technicians">;
    name: string;
  } | null>(null);

  if (technicians === undefined) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-bold">Technicians</h1>
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const activeTechs = technicians.filter((t) => t.isActive);
  const inactiveTechs = technicians.filter((t) => !t.isActive);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Technicians</h1>
          <p className="text-muted-foreground">
            {activeTechs.length} active technician{activeTechs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setFormDialog({ mode: "add" })}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Technician
        </Button>
      </div>

      {/* Active technicians */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeTechs.map((tech) => {
          const callCount = activeCallCounts?.[tech._id] ?? 0;
          return (
            <Card key={tech._id}>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: tech.color }}
                />
                <CardTitle className="text-base">{tech.name}</CardTitle>
                {callCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {callCount} call{callCount !== 1 ? "s" : ""}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <a href={`tel:${formatPhone(tech.phone)}`} className="hover:underline">
                    {formatPhone(tech.phone)}
                  </a>
                </div>
                {tech.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <a href={`mailto:${tech.email}`} className="hover:underline">
                      {tech.email}
                    </a>
                  </div>
                )}
                <div className="flex gap-1 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormDialog({ mode: "edit", technician: tech })}
                    className="gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setLinkingTech({ id: tech._id, name: tech.name })
                    }
                    className="gap-1"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Link
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDeactivating({ id: tech._id, name: tech.name })
                    }
                    className="gap-1 text-muted-foreground"
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Inactive technicians */}
      {inactiveTechs.length > 0 && (
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowInactive((v) => !v)}
            className="text-muted-foreground"
          >
            {showInactive ? "Hide" : "Show"} {inactiveTechs.length} inactive
          </Button>
          {showInactive && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inactiveTechs.map((tech) => (
                <Card key={tech._id} className="opacity-50">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: tech.color }}
                    />
                    <CardTitle className="text-base">{tech.name}</CardTitle>
                    <Badge variant="secondary" className="ml-auto">
                      Inactive
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {formatPhone(tech.phone)}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFormDialog({ mode: "edit", technician: tech })}
                      className="gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      {linkingTech && (
        <LinkAccountDialog
          technicianId={linkingTech.id}
          technicianName={linkingTech.name}
          open={!!linkingTech}
          onOpenChange={(open) => {
            if (!open) setLinkingTech(null);
          }}
        />
      )}

      <TechnicianFormDialog
        mode={formDialog?.mode ?? "add"}
        technician={formDialog?.technician}
        open={!!formDialog}
        onOpenChange={(open) => {
          if (!open) setFormDialog(null);
        }}
      />

      {deactivating && (
        <DeactivateDialog
          technicianId={deactivating.id}
          technicianName={deactivating.name}
          activeCallCount={activeCallCounts?.[deactivating.id] ?? 0}
          open={!!deactivating}
          onOpenChange={(open) => {
            if (!open) setDeactivating(null);
          }}
        />
      )}
    </div>
  );
}
