import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number): Date => new Date(Date.now() - n * DAY);
const daysFromNow = (n: number): Date => new Date(Date.now() + n * DAY);

/**
 * Ofertas tech mock para desarrollo del módulo Jobs (M03).
 * Datos ficticios, sin APIs externas. Variedad por remoteType, seniority,
 * contractType, tags, salario y expiración. Incluye casos CLOSED y expirado
 * marcados explícitamente para facilitar pruebas manuales de las reglas de negocio.
 */
const jobs: Prisma.JobCreateInput[] = [
  {
    title: "Frontend Developer",
    company: "Nova Labs",
    location: "Bilbao",
    remoteType: "HYBRID",
    description: "Desarrollo de interfaces con React y TypeScript para producto SaaS.",
    requirements: ["React", "TypeScript", "CSS"],
    seniority: "JUNIOR",
    contractType: "FULL_TIME",
    salaryMin: 24000,
    salaryMax: 32000,
    tags: ["React", "TypeScript", "Next.js"],
    status: "ACTIVE",
    postedAt: daysAgo(1)
  },
  {
    title: "Backend Engineer",
    company: "Datapeak",
    location: "Madrid",
    remoteType: "REMOTE",
    description: "APIs en Node.js con PostgreSQL y Prisma. Cultura de testing.",
    requirements: ["Node.js", "PostgreSQL", "Prisma"],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: 38000,
    salaryMax: 50000,
    tags: ["Node.js", "PostgreSQL", "Prisma", "TypeScript"],
    status: "ACTIVE",
    postedAt: daysAgo(2)
  },
  {
    title: "Full Stack Developer",
    company: "Orbital",
    location: "Valencia",
    remoteType: "REMOTE",
    description: "Stack TypeScript de extremo a extremo con Next.js y Node.js.",
    requirements: ["TypeScript", "Next.js", "Node.js"],
    seniority: "SENIOR",
    contractType: "FULL_TIME",
    salaryMin: 55000,
    salaryMax: 70000,
    tags: ["TypeScript", "Next.js", "Node.js", "PostgreSQL"],
    status: "ACTIVE",
    postedAt: daysAgo(3)
  },
  {
    title: "Android Engineer",
    company: "Mobika",
    location: "Bilbao",
    remoteType: "ON_SITE",
    description: "Aplicaciones nativas Android con Kotlin y Jetpack Compose.",
    requirements: ["Kotlin", "Android", "Jetpack Compose"],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: 36000,
    salaryMax: 48000,
    tags: ["Kotlin", "Android"],
    status: "ACTIVE",
    postedAt: daysAgo(4)
  },
  {
    title: "DevOps Engineer",
    company: "Cloudforge",
    location: "Remoto",
    remoteType: "REMOTE",
    description: "Infraestructura como código, CI/CD y observabilidad.",
    requirements: ["Docker", "Kubernetes", "Terraform"],
    seniority: "SENIOR",
    contractType: "CONTRACT",
    salaryMin: 60000,
    salaryMax: 80000,
    tags: ["DevOps", "Docker", "PostgreSQL"],
    status: "ACTIVE",
    postedAt: daysAgo(5)
  },
  {
    title: "Junior QA Engineer",
    company: "Testly",
    location: "Sevilla",
    remoteType: "HYBRID",
    description: "Automatización de pruebas end-to-end y de integración.",
    requirements: ["TypeScript", "Testing"],
    seniority: "JUNIOR",
    contractType: "PART_TIME",
    salaryMin: 18000,
    salaryMax: 24000,
    tags: ["TypeScript", "Testing"],
    status: "ACTIVE",
    postedAt: daysAgo(6)
  },
  {
    title: "React Native Developer",
    company: "Appnest",
    location: "Barcelona",
    remoteType: "HYBRID",
    description: "Apps móviles multiplataforma con React Native.",
    requirements: ["React", "React Native", "TypeScript"],
    seniority: "MID",
    contractType: "FREELANCE",
    salaryMin: 40000,
    salaryMax: 55000,
    tags: ["React", "TypeScript"],
    status: "ACTIVE",
    postedAt: daysAgo(7)
  },
  {
    title: "Data Engineer",
    company: "Streamline",
    location: "Madrid",
    remoteType: "REMOTE",
    description: "Pipelines de datos y modelado en PostgreSQL.",
    requirements: ["Python", "PostgreSQL", "SQL"],
    seniority: "SENIOR",
    contractType: "FULL_TIME",
    salaryMin: 58000,
    salaryMax: 75000,
    tags: ["PostgreSQL", "DevOps"],
    status: "ACTIVE",
    postedAt: daysAgo(8)
  },
  {
    title: "Software Engineer (Open level)",
    company: "Polyglot",
    location: "Remoto",
    remoteType: "REMOTE",
    description: "Buscamos talento de cualquier nivel; te ubicamos según experiencia.",
    requirements: ["TypeScript", "Node.js"],
    seniority: "ANY",
    contractType: "FULL_TIME",
    salaryMin: 30000,
    salaryMax: 65000,
    tags: ["TypeScript", "Node.js", "React"],
    status: "ACTIVE",
    postedAt: daysAgo(1)
  },
  {
    title: "Platform Engineer",
    company: "Gridscale",
    location: "Bilbao",
    remoteType: "ON_SITE",
    description: "Plataforma interna de desarrollo, tooling y automatización.",
    requirements: ["Go", "Docker", "PostgreSQL"],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: 42000,
    salaryMax: 56000,
    tags: ["DevOps", "PostgreSQL"],
    status: "ACTIVE",
    postedAt: daysAgo(9)
  },
  {
    title: "Frontend Intern",
    company: "Brightside",
    location: "Zaragoza",
    remoteType: "ON_SITE",
    description: "Prácticas en desarrollo frontend con Next.js.",
    requirements: ["JavaScript", "React"],
    seniority: "JUNIOR",
    contractType: "PART_TIME",
    salaryMin: null,
    salaryMax: null,
    tags: ["React", "Next.js"],
    status: "ACTIVE",
    postedAt: daysAgo(2),
    expiresAt: daysFromNow(30)
  },
  {
    title: "Lead Backend Engineer",
    company: "Corewave",
    location: "Madrid",
    remoteType: "HYBRID",
    description: "Liderazgo técnico de un equipo backend en Node.js.",
    requirements: ["Node.js", "PostgreSQL", "Prisma", "Leadership"],
    seniority: "SENIOR",
    contractType: "FULL_TIME",
    salaryMin: 70000,
    salaryMax: 90000,
    tags: ["Node.js", "PostgreSQL", "Prisma"],
    status: "ACTIVE",
    postedAt: daysAgo(10)
  },
  // Caso CLOSED (no debe aparecer en listado ni detalle) — incluido a propósito para pruebas manuales.
  {
    title: "Closed Role - Fullstack",
    company: "Legacy Systems",
    location: "Bilbao",
    remoteType: "ON_SITE",
    description: "Oferta ya cerrada; sirve para validar el filtrado de status CLOSED.",
    requirements: ["TypeScript"],
    seniority: "MID",
    contractType: "FULL_TIME",
    salaryMin: 35000,
    salaryMax: 45000,
    tags: ["TypeScript"],
    status: "CLOSED",
    postedAt: daysAgo(20)
  },
  // Caso expirado (ACTIVE pero expiresAt en el pasado) — incluido a propósito para pruebas manuales.
  {
    title: "Expired Role - Frontend",
    company: "Timeout Inc",
    location: "Remoto",
    remoteType: "REMOTE",
    description: "Oferta vigente por estado pero expirada por fecha; valida la regla de expiración.",
    requirements: ["React"],
    seniority: "JUNIOR",
    contractType: "FREELANCE",
    salaryMin: 28000,
    salaryMax: 36000,
    tags: ["React", "TypeScript"],
    status: "ACTIVE",
    postedAt: daysAgo(40),
    expiresAt: daysAgo(5)
  }
];

async function main(): Promise<void> {
  // Idempotente para desarrollo: limpia solo la tabla Job antes de re-sembrar.
  // No toca User, CandidateProfile ni ninguna otra entidad.
  await prisma.job.deleteMany();
  // Las ofertas seed/mock son internas: se marcan explícitamente como INTERNAL
  // (el default del modelo ya es INTERNAL; esto lo hace explícito y determinista).
  await prisma.job.createMany({
    data: jobs.map((job) => ({ ...job, source: "INTERNAL" as const }))
  });

  const total = await prisma.job.count();
  console.log(`Seed completado: ${total} ofertas Job insertadas.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
