"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BringToFront,
  SendToBack,
  Group,
  Ungroup,
} from "lucide-react";

interface LayerActionsProps {
  onBringForward: () => void;
  onSendBackward: () => void;
  onGroup?:    () => void;
  onUngroup?:  () => void;
  showGroup?:  boolean;
  showUngroup?: boolean;
}

const btnCls = "h-7 w-7 text-slate-400 hover:text-slate-100 hover:bg-slate-700";

export function LayerActions({
  onBringForward,
  onSendBackward,
  onGroup,
  onUngroup,
  showGroup   = false,
  showUngroup = false,
}: LayerActionsProps) {
  return (
    <div className="flex items-center gap-0.5 ml-1">
      <Separator orientation="vertical" className="h-6 bg-slate-600 mr-1" />

      {showGroup && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={btnCls} onClick={onGroup}>
              <Group size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Grupează (Ctrl+G)</TooltipContent>
        </Tooltip>
      )}

      {showUngroup && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={btnCls} onClick={onUngroup}>
              <Ungroup size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Dezgrupează (Ctrl+Shift+G)</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={btnCls} onClick={onBringForward}>
            <BringToFront size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Aduce înainte</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className={btnCls} onClick={onSendBackward}>
            <SendToBack size={14} />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Trimite înapoi</TooltipContent>
      </Tooltip>
    </div>
  );
}
