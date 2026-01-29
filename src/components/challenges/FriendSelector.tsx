"use client";

/**
 * FriendSelector Component (PRD-54)
 *
 * Searchable dropdown of league members for challenge target selection.
 *
 * Design System:
 * - Uses shadcn Command component for combobox pattern
 * - Groups members by league for multi-league users
 * - Shows avatar + display name
 */

import { useState, useMemo } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Member {
    id: string;
    display_name: string;
    avatar_url?: string | null;
    league_id?: string;
    league_name?: string;
}

interface LeagueGroup {
    league_id: string;
    league_name: string;
    members: Member[];
}

interface FriendSelectorProps {
    members: Member[];
    selectedId: string | null;
    onSelect: (member: Member | null) => void;
    currentUserId: string;
    excludeIds?: string[];
    placeholder?: string;
    disabled?: boolean;
}

export function FriendSelector({
    members,
    selectedId,
    onSelect,
    currentUserId,
    excludeIds = [],
    placeholder = "Select opponent...",
    disabled = false,
}: FriendSelectorProps) {
    const [open, setOpen] = useState(false);

    // Filter out current user and excluded users
    const filteredMembers = useMemo(() => {
        return members.filter(
            (m) => m.id !== currentUserId && !excludeIds.includes(m.id)
        );
    }, [members, currentUserId, excludeIds]);

    // Group by league
    const groupedMembers = useMemo(() => {
        const groups: Record<string, LeagueGroup> = {};

        for (const member of filteredMembers) {
            const leagueId = member.league_id || "no-league";
            const leagueName = member.league_name || "Other Members";

            if (!groups[leagueId]) {
                groups[leagueId] = {
                    league_id: leagueId,
                    league_name: leagueName,
                    members: [],
                };
            }

            groups[leagueId].members.push(member);
        }

        // Sort groups by league name
        return Object.values(groups).sort((a, b) =>
            a.league_name.localeCompare(b.league_name)
        );
    }, [filteredMembers]);

    // Find selected member
    const selectedMember = selectedId
        ? filteredMembers.find((m) => m.id === selectedId)
        : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedMember ? (
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {selectedMember.display_name?.charAt(0).toUpperCase() || "?"}
                                </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{selectedMember.display_name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search members..." />
                    <CommandList>
                        <CommandEmpty>
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                <Search className="mx-auto mb-2 h-6 w-6 opacity-50" />
                                No members found
                            </div>
                        </CommandEmpty>

                        {groupedMembers.map((group) => (
                            <CommandGroup key={group.league_id} heading={group.league_name}>
                                {group.members.map((member) => (
                                    <CommandItem
                                        key={member.id}
                                        value={`${member.display_name}-${member.id}`}
                                        onSelect={() => {
                                            onSelect(member.id === selectedId ? null : member);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-2 flex-1">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-xs bg-muted">
                                                    {member.display_name?.charAt(0).toUpperCase() || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">{member.display_name}</span>
                                        </div>
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                selectedId === member.id
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
