"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UnmatchDialog } from "./unmatch-dialog";
import { ArrowLeft } from "lucide-react";
import { similarityToPercentage } from "@/lib/utils";
import type { MatchPartner } from "@/types";

interface ChatHeaderProps {
  partner: MatchPartner;
  matchId: string;
}

export function ChatHeader({ partner, matchId }: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Avatar name={partner.partner_name} size="md" />
          <div>
            <h1 className="font-semibold">{partner.partner_name}</h1>
            <p className="text-sm text-muted-foreground">{partner.partner_major}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="success">
            {similarityToPercentage(partner.similarity_score)}% Match
          </Badge>
          <UnmatchDialog matchId={matchId} partnerName={partner.partner_name ?? "your match"} />
        </div>
      </div>

      {partner.partner_bio && (
        <div className="border-t px-4 py-3">
          <p className="text-sm text-muted-foreground">{partner.partner_bio}</p>
        </div>
      )}
    </header>
  );
}
