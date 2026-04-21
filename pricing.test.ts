import { describe, it, expect } from "vitest";
import { DEFAULT_PRICING_PLANS } from "./pricingService";

describe("Pricing Service", () => {
  describe("DEFAULT_PRICING_PLANS", () => {
    it("should have 4 pricing plans", () => {
      expect(DEFAULT_PRICING_PLANS).toHaveLength(4);
    });

    it("should have correct prices for each plan", () => {
      // Single Download: ¥50
      expect(DEFAULT_PRICING_PLANS[0].price).toBe(5000);
      expect(DEFAULT_PRICING_PLANS[0].name).toBe("单次下载");
      expect(DEFAULT_PRICING_PLANS[0].billingCycle).toBe("once");
      expect(DEFAULT_PRICING_PLANS[0].downloadQuota).toBe(1);

      // Basic: ¥99/month
      expect(DEFAULT_PRICING_PLANS[1].price).toBe(9900);
      expect(DEFAULT_PRICING_PLANS[1].name).toBe("基础版");
      expect(DEFAULT_PRICING_PLANS[1].billingCycle).toBe("monthly");
      expect(DEFAULT_PRICING_PLANS[1].downloadQuota).toBe(5);

      // Standard: ¥159/month
      expect(DEFAULT_PRICING_PLANS[2].price).toBe(15900);
      expect(DEFAULT_PRICING_PLANS[2].name).toBe("标准版");
      expect(DEFAULT_PRICING_PLANS[2].billingCycle).toBe("monthly");
      expect(DEFAULT_PRICING_PLANS[2].downloadQuota).toBe(10);

      // Premium: ¥299/month
      expect(DEFAULT_PRICING_PLANS[3].price).toBe(29900);
      expect(DEFAULT_PRICING_PLANS[3].name).toBe("高级版");
      expect(DEFAULT_PRICING_PLANS[3].billingCycle).toBe("monthly");
      expect(DEFAULT_PRICING_PLANS[3].downloadQuota).toBe(20);
    });

    it("should have correct English names", () => {
      expect(DEFAULT_PRICING_PLANS[0].nameEn).toBe("Single Download");
      expect(DEFAULT_PRICING_PLANS[1].nameEn).toBe("Basic");
      expect(DEFAULT_PRICING_PLANS[2].nameEn).toBe("Standard");
      expect(DEFAULT_PRICING_PLANS[3].nameEn).toBe("Premium");
    });

    it("should have features array for each plan", () => {
      DEFAULT_PRICING_PLANS.forEach((plan) => {
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it("should have correct feature flags", () => {
      // All plans should have Word/PDF, Stata/R code, all figures, and Lancet declaration
      DEFAULT_PRICING_PLANS.forEach((plan) => {
        expect(plan.hasWordPdf).toBe(true);
        expect(plan.hasStataRCode).toBe(true);
        expect(plan.hasAllFigures).toBe(true);
        expect(plan.hasLancetDeclaration).toBe(true);
      });

      // Only Basic and above have priority support
      expect(DEFAULT_PRICING_PLANS[0].hasPrioritySupport).toBe(false);
      expect(DEFAULT_PRICING_PLANS[1].hasPrioritySupport).toBe(true);
      expect(DEFAULT_PRICING_PLANS[2].hasPrioritySupport).toBe(true);

      // Only Premium has dedicated support
      expect(DEFAULT_PRICING_PLANS[3].hasDedicatedSupport).toBe(true);

      // Only Standard and Premium have advanced stats
      expect(DEFAULT_PRICING_PLANS[2].hasAdvancedStats).toBe(true);
      expect(DEFAULT_PRICING_PLANS[3].hasAdvancedStats).toBe(true);

      // Only Premium has custom template
      expect(DEFAULT_PRICING_PLANS[3].hasCustomTemplate).toBe(true);
    });

    it("should have display order", () => {
      expect(DEFAULT_PRICING_PLANS[0].displayOrder).toBe(1);
      expect(DEFAULT_PRICING_PLANS[1].displayOrder).toBe(2);
      expect(DEFAULT_PRICING_PLANS[2].displayOrder).toBe(3);
      expect(DEFAULT_PRICING_PLANS[3].displayOrder).toBe(4);
    });
  });
});
