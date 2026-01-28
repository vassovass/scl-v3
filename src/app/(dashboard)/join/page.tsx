"use client";

import Link from "next/link";
import { ModuleFeedback } from "@/components/ui/ModuleFeedback";
import { JoinLeagueForm } from "@/components/forms/JoinLeagueForm";

export default function JoinLeaguePage() {



  return (
    <div className="bg-background">
      {/* Page Title */}
      <div className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">Join a League</h1>
        </div>
      </div>

      {/* Main */}
      <ModuleFeedback moduleId="join-league-form" moduleName="Join League Form">
        <div className="mx-auto max-w-md px-6 py-12">
          <p className="text-center text-muted-foreground">
            Enter the invite code shared by your league admin.
          </p>

          <div className="mt-8">
            <JoinLeagueForm />
          </div>
        </div>
      </ModuleFeedback>
    </div>
  );
}

