"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRewriterStore } from "@/lib/store/rewriter-store";

export function DesignToolsOptionsPanel() {
  const { designToolsOptions, setDesignToolsOptions } = useRewriterStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>DesignPLUS Formatting</CardTitle>
        <CardDescription>
          Configure how content should be formatted with Cidi Labs DesignPLUS patterns.
          Uses the "Flat Sections" theme (dp-flat-sections variation-2).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Iframe Accordion */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="wrapIframesInAccordion"
              checked={designToolsOptions.wrapIframesInAccordion}
              onCheckedChange={(checked) =>
                setDesignToolsOptions({ wrapIframesInAccordion: checked as boolean })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="wrapIframesInAccordion" className="font-medium">
                Wrap iframes in accordions
              </Label>
              <p className="text-xs text-muted-foreground">
                Place each video/iframe inside a collapsible accordion panel
              </p>
            </div>
          </div>
          {designToolsOptions.wrapIframesInAccordion && (
            <div className="ml-6 space-y-2">
              <Label htmlFor="iframeAccordionLabel">Accordion button label</Label>
              <Input
                id="iframeAccordionLabel"
                value={designToolsOptions.iframeAccordionLabel}
                onChange={(e) =>
                  setDesignToolsOptions({ iframeAccordionLabel: e.target.value })
                }
                placeholder="Click to view video"
                className="w-64"
              />
            </div>
          )}
        </div>

        {/* Content Enhancement */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="enhanceWrittenContent"
            checked={designToolsOptions.enhanceWrittenContent}
            onCheckedChange={(checked) =>
              setDesignToolsOptions({ enhanceWrittenContent: checked as boolean })
            }
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="enhanceWrittenContent" className="font-medium">
              Enhance written content
            </Label>
            <p className="text-xs text-muted-foreground">
              Improve readability, fix grammar, improve sentence structure
            </p>
          </div>
        </div>

        {/* Add Callouts */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="addCallouts"
              checked={designToolsOptions.addCallouts}
              onCheckedChange={(checked) =>
                setDesignToolsOptions({ addCallouts: checked as boolean })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="addCallouts" className="font-medium">
                Add callout boxes
              </Label>
              <p className="text-xs text-muted-foreground">
                Wrap important info, tips, and warnings in styled callout boxes
              </p>
            </div>
          </div>
          {designToolsOptions.addCallouts && (
            <div className="ml-6 space-y-2">
              <Label>Detection mode</Label>
              <Select
                value={designToolsOptions.calloutDetection}
                onValueChange={(value: "auto" | "manual") =>
                  setDesignToolsOptions({ calloutDetection: value })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                  <SelectItem value="manual">Manual only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Frame Images */}
        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="frameImages"
              checked={designToolsOptions.frameImages}
              onCheckedChange={(checked) =>
                setDesignToolsOptions({ frameImages: checked as boolean })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="frameImages" className="font-medium">
                Frame images
              </Label>
              <p className="text-xs text-muted-foreground">
                Wrap standalone images in dp-image-frame for better presentation
              </p>
            </div>
          </div>
          {designToolsOptions.frameImages && (
            <div className="ml-6 flex items-start space-x-2">
              <Checkbox
                id="addImageCaptions"
                checked={designToolsOptions.addImageCaptions}
                onCheckedChange={(checked) =>
                  setDesignToolsOptions({ addImageCaptions: checked as boolean })
                }
              />
              <Label htmlFor="addImageCaptions" className="text-sm">
                Add image captions
              </Label>
            </div>
          )}
        </div>

        {/* Icon Headers */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="useIconHeaders"
            checked={designToolsOptions.useIconHeaders}
            onCheckedChange={(checked) =>
              setDesignToolsOptions({ useIconHeaders: checked as boolean })
            }
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="useIconHeaders" className="font-medium">
              Add icons to section headers
            </Label>
            <p className="text-xs text-muted-foreground">
              Add Font Awesome icons to H3 headings based on content type
            </p>
          </div>
        </div>

        {/* Fix Heading Hierarchy */}
        <div className="flex items-start space-x-2">
          <Checkbox
            id="fixHeadingHierarchy"
            checked={designToolsOptions.fixHeadingHierarchy}
            onCheckedChange={(checked) =>
              setDesignToolsOptions({ fixHeadingHierarchy: checked as boolean })
            }
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="fixHeadingHierarchy" className="font-medium">
              Fix heading hierarchy (Accessibility)
            </Label>
            <p className="text-xs text-muted-foreground">
              Ensure proper H2 → H3 → H4 structure without skipping levels
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
