import { expect, test, type Locator, type Page } from "@playwright/test";

const VIEWPORTS = [
  { width: 320, height: 844 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
  { width: 1440, height: 1000 }
] as const;

const TITLE = "JobIT | Perfil tech vivo y match explicable";
const DESCRIPTION =
  "Construye tu perfil tech, reúne tu experiencia y proyectos, explora ofertas y entiende tu afinidad mediante reglas visibles.";

async function settleResponsiveLayout(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      })
  );
}

async function contrastRatio(locator: Locator): Promise<number> {
  return locator.evaluate((element) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas 2D no disponible para medir contraste");

    const toRgb = (color: string): [number, number, number] => {
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
      return [red, green, blue];
    };

    const luminance = (color: string): number =>
      toRgb(color)
        .map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
        })
        .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);

    const foreground = getComputedStyle(element).color;
    let backgroundElement: Element | null = element;
    let background = "rgba(0, 0, 0, 0)";
    while (backgroundElement && background === "rgba(0, 0, 0, 0)") {
      background = getComputedStyle(backgroundElement).backgroundColor;
      backgroundElement = backgroundElement.parentElement;
    }

    const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
      (left, right) => right - left
    );
    return (lighter + 0.05) / (darker + 0.05);
  });
}

test.describe("landing public surface hardening", () => {
  test("publica estructura, copy, navegación y metadata aprobados", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(TITLE);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", DESCRIPTION);
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "es_ES");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", TITLE);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      DESCRIPTION
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary");
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute("content", TITLE);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
      "content",
      DESCRIPTION
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveCount(0);

    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Tu perfil tech vivo para explorar oportunidades en JobIT"
      })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "JobIT" }).first()).toHaveAttribute("href", "/");
    await expect(page.getByRole("link", { name: "Ver capacidades" })).toHaveAttribute(
      "href",
      "#capacidades"
    );

    const destinations = [
      ["Producto", "#producto"],
      ["Capacidades", "#capacidades"],
      ["Cómo funciona", "#funcionamiento"],
      ["Roadmap", "#roadmap"]
    ] as const;
    for (const [name, href] of destinations) {
      await expect(page.getByRole("navigation", { name: "Pie" }).getByRole("link", { name })).toHaveAttribute(
        "href",
        href
      );
      await expect(page.locator(href)).toHaveCount(1);
    }

    await expect(page.getByRole("figure")).toBeVisible();
    await expect(page.getByText("Ejemplo ilustrativo · datos ficticios")).toBeVisible();
    await expect(page.getByText("Alex Ejemplo")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/\bMVP\b/i);
    await expect(page.locator("body")).not.toContainText(/jobit\.app/i);
    await expect(page.locator("body")).not.toContainText(/IA avanzada/i);
    await expect(page.locator("body")).not.toContainText(/garantizamos empleo/i);
  });

  test("el skip link es el primer control, se muestra con foco y alcanza main", async ({ page }) => {
    await page.goto("/");
    const skipLink = page.getByRole("link", { name: "Saltar al contenido principal" });

    await page.keyboard.press("Tab");
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();
    expect(
      await skipLink.evaluate((element) => getComputedStyle(element).boxShadow)
    ).not.toBe("none");

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#contenido-principal$/);
    await expect(page.getByRole("main")).toBeFocused();
  });

  test("cumple la matriz responsive, los rectángulos y los targets", async ({ page }) => {
    await page.goto("/");

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      await settleResponsiveLayout(page);

      const result = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const selectors = [
          "header",
          "h1",
          '[data-testid="product-preview"]',
          'a[href="/register"]',
          'a[href="#capacidades"]',
          "footer"
        ];
        const geometryIssues: string[] = [];

        for (const selector of selectors) {
          document.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
            const style = getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden") return;
            const rect = element.getBoundingClientRect();
            if (rect.left < -0.5 || rect.right > viewportWidth + 0.5) {
              geometryIssues.push(
                `${selector}[${index}] left=${rect.left.toFixed(1)} right=${rect.right.toFixed(1)}`
              );
            }
          });
        }

        const headerLinks = Array.from(document.querySelectorAll<HTMLElement>("header a")).filter(
          (element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0;
          }
        );
        const headerOverlap = headerLinks.some((first, firstIndex) =>
          headerLinks.slice(firstIndex + 1).some((second) => {
            const a = first.getBoundingClientRect();
            const b = second.getBoundingClientRect();
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
          })
        );

        const targetIssues = Array.from(
          document.querySelectorAll<HTMLElement>('a:not([href="#contenido-principal"])')
        )
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0;
          })
          .flatMap((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width < 24 || rect.height < 44
              ? [`${element.textContent?.trim()}: ${rect.width.toFixed(1)}×${rect.height.toFixed(1)}`]
              : [];
          });

        const heading = document.querySelector<HTMLElement>("h1");
        return {
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth,
          geometryIssues,
          headerOverlap,
          targetIssues,
          h1Fits: Boolean(heading && heading.scrollWidth <= heading.clientWidth + 1),
          wordBreak: heading ? getComputedStyle(heading).wordBreak : null,
          overflowWrap: heading ? getComputedStyle(heading).overflowWrap : null
        };
      });

      expect(result.scrollWidth, JSON.stringify(viewport)).toBeLessThanOrEqual(result.viewportWidth);
      expect(result.geometryIssues, JSON.stringify(viewport)).toEqual([]);
      expect(result.headerOverlap, JSON.stringify(viewport)).toBe(false);
      expect(result.targetIssues, JSON.stringify(viewport)).toEqual([]);
      expect(result.h1Fits, JSON.stringify(viewport)).toBe(true);
      expect(result.wordBreak, JSON.stringify(viewport)).toBe("normal");
      expect(result.overflowWrap, JSON.stringify(viewport)).toBe("normal");

      const sectionNavigation = page.getByRole("navigation", { name: "Secciones" });
      if (viewport.width < 768) {
        await expect(sectionNavigation).toBeHidden();
        await expect(page.getByRole("link", { name: "Acceder" })).toBeVisible();
      } else {
        await expect(sectionNavigation).toBeVisible();
        await expect(page.getByRole("link", { name: "Iniciar sesión" }).first()).toBeVisible();
      }
    }
  });

  test("respeta reduced motion sin eliminar el comportamiento normal", async ({ page }) => {
    await page.goto("/");
    const primaryCta = page.getByRole("link", { name: "Crear mi perfil" }).first();
    const moduleCard = page.getByRole("article").filter({ hasText: "Dashboard" });

    await page.emulateMedia({ reducedMotion: "no-preference" });
    await primaryCta.hover();
    await page.waitForTimeout(200);
    expect(await primaryCta.evaluate((element) => getComputedStyle(element).scale)).not.toBe("1");

    const normalCardBefore = await moduleCard.evaluate(
      (element) => getComputedStyle(element).boxShadow
    );
    await moduleCard.hover();
    await page.waitForTimeout(200);
    const normalCardAfter = await moduleCard.evaluate(
      (element) => getComputedStyle(element).boxShadow
    );
    expect(normalCardAfter).not.toBe(normalCardBefore);
    expect(await moduleCard.evaluate((element) => getComputedStyle(element).translate)).not.toBe(
      "none"
    );

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("h1").hover();
    await page.waitForTimeout(50);
    await moduleCard.hover();
    await page.waitForTimeout(50);
    const reducedCardAfter = await moduleCard.evaluate(
      (element) => getComputedStyle(element).boxShadow
    );
    expect(await moduleCard.evaluate((element) => getComputedStyle(element).translate)).toBe("0px");
    expect(await moduleCard.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe(
      "none"
    );
    expect(reducedCardAfter).toContain("0px 1px 3px 0px");
    expect(reducedCardAfter).not.toContain("0px 25px 50px");

    await primaryCta.hover();
    await page.waitForTimeout(50);
    expect(await primaryCta.evaluate((element) => getComputedStyle(element).scale)).toBe("1");
  });

  test("los textos corregidos superan contraste AA", async ({ page }) => {
    await page.goto("/");

    const labels = [
      page.getByText("Vista ilustrativa de JobIT"),
      page.getByText("Proyecto", { exact: true }),
      page.getByText("Tecnología actual"),
      page.getByText("Afinidad ilustrativa: 82/100"),
      page.getByText("© 2026 JobIT")
    ];

    for (const label of labels) {
      expect(await contrastRatio(label)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
