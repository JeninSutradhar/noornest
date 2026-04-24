import { copyFileSync, existsSync, mkdirSync } from "fs";
import path from "path";

import bcrypt from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Renamed files in prisma/seed_images — copied to public/uploads/seed for local URLs */
const SEED_IMG = {
  velvetQuran: "velvet-quran-cover-green.webp",
  bismillahFrame: "bismillah-framed-wall-art.webp",
  carTasbeeh: "car-tasbeeh-holder.jpg",
  geometricPlaque: "geometric-allah-muhammad-plaque.jpg",
  giftHamper: "ramadan-gift-hamper.png",
  quranLamp: "led-quran-speaker-lamp.jpg",
  prayerMat: "prayer-mat-patterned.jpg",
  oudBurner: "brass-oud-burner.jpg",
} as const;

function seedPublicUrl(filename: string) {
  return `/uploads/seed/${filename}`;
}

function copySeedImagesToPublic() {
  const srcDir = path.join(process.cwd(), "prisma", "seed_images");
  const destDir = path.join(process.cwd(), "public", "uploads", "seed");
  mkdirSync(destDir, { recursive: true });
  for (const filename of Object.values(SEED_IMG)) {
    const src = path.join(srcDir, filename);
    const dest = path.join(destDir, filename);
    if (!existsSync(src)) {
      console.warn(`Seed image missing (skipped): ${src}`);
      continue;
    }
    copyFileSync(src, dest);
  }
}

async function wipeStoreCatalog() {
  await prisma.review.deleteMany({});
  await prisma.homepageSectionProduct.deleteMany({});
  await prisma.couponProductRule.deleteMany({});
  await prisma.couponCategoryRule.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({ where: { parentId: { not: null } } });
  await prisma.category.deleteMany({});
}

async function main() {
  copySeedImagesToPublic();

  const adminPass = await bcrypt.hash("Admin@123", 10);
  const customerPass = await bcrypt.hash("Customer@123", 10);
  const customer2Pass = await bcrypt.hash("Customer@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@noornest.com" },
    update: {
      name: "NoorNest Admin",
      role: "ADMIN",
      phone: "9990001111",
      isActive: true,
      passwordHash: adminPass,
    },
    create: {
      name: "NoorNest Admin",
      role: "ADMIN",
      email: "admin@noornest.com",
      phone: "9990001111",
      passwordHash: adminPass,
      isActive: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@noornest.com" },
    update: {
      name: "Sample Customer",
      role: "CUSTOMER",
      phone: "9990002222",
      isActive: true,
      passwordHash: customerPass,
    },
    create: {
      name: "Sample Customer",
      role: "CUSTOMER",
      email: "customer@noornest.com",
      phone: "9990002222",
      passwordHash: customerPass,
      isActive: true,
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: "amina@noornest.com" },
    update: {
      name: "Amina Khan",
      role: "CUSTOMER",
      phone: "9990003333",
      isActive: true,
      passwordHash: customer2Pass,
    },
    create: {
      name: "Amina Khan",
      role: "CUSTOMER",
      email: "amina@noornest.com",
      phone: "9990003333",
      passwordHash: customer2Pass,
      isActive: true,
    },
  });

  await prisma.address.upsert({
    where: { id: "seed-customer-address-1" },
    update: {
      userId: customer.id,
      fullName: "Sample Customer",
      phone: "9990002222",
      line1: "101 Noor Residency",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700001",
      country: "India",
      isDefault: true,
    },
    create: {
      id: "seed-customer-address-1",
      userId: customer.id,
      type: "HOME",
      fullName: "Sample Customer",
      phone: "9990002222",
      email: "customer@noornest.com",
      line1: "101 Noor Residency",
      city: "Kolkata",
      state: "West Bengal",
      postalCode: "700001",
      country: "India",
      isDefault: true,
    },
  });

  await wipeStoreCatalog();

  const catQuran = await prisma.category.create({
    data: {
      name: "Quran & Learning",
      slug: "quran-learning",
      description: "Mushafs, covers, audio devices, and essentials for Quran care.",
      imageUrl: seedPublicUrl(SEED_IMG.velvetQuran),
      sortOrder: 1,
      featured: true,
      isActive: true,
    },
  });

  const catQuranCovers = await prisma.category.create({
    data: {
      name: "Velvet & Premium Covers",
      slug: "velvet-premium-covers",
      parentId: catQuran.id,
      description: "Embroidered and velvet covers to protect and gift-wrap your Quran.",
      imageUrl: seedPublicUrl(SEED_IMG.velvetQuran),
      sortOrder: 1,
      featured: false,
      isActive: true,
    },
  });

  const catQuranDigital = await prisma.category.create({
    data: {
      name: "Digital & Audio",
      slug: "quran-digital-audio",
      parentId: catQuran.id,
      description: "Speakers, lamps, and devices for learning and listening.",
      imageUrl: seedPublicUrl(SEED_IMG.quranLamp),
      sortOrder: 2,
      featured: false,
      isActive: true,
    },
  });

  const catWall = await prisma.category.create({
    data: {
      name: "Wall Art & Decor",
      slug: "wall-art-decor",
      description: "Framed ayat, plaques, and statement pieces for the home.",
      imageUrl: seedPublicUrl(SEED_IMG.bismillahFrame),
      sortOrder: 2,
      featured: true,
      isActive: true,
    },
  });

  const catWallFramed = await prisma.category.create({
    data: {
      name: "Framed Calligraphy",
      slug: "framed-calligraphy",
      parentId: catWall.id,
      description: "Ready-to-hang framed works in gold, acrylic, and wood finishes.",
      imageUrl: seedPublicUrl(SEED_IMG.bismillahFrame),
      sortOrder: 1,
      featured: true,
      isActive: true,
    },
  });

  const catWallPlaques = await prisma.category.create({
    data: {
      name: "Plaques & Layered Art",
      slug: "plaques-layered-art",
      parentId: catWall.id,
      description: "Layered wood, metal accent, and geometric Islamic wall pieces.",
      imageUrl: seedPublicUrl(SEED_IMG.geometricPlaque),
      sortOrder: 2,
      featured: false,
      isActive: true,
    },
  });

  const catCar = await prisma.category.create({
    data: {
      name: "Car & Travel",
      slug: "car-travel",
      description: "Dhikr and accessories for the road.",
      imageUrl: seedPublicUrl(SEED_IMG.carTasbeeh),
      sortOrder: 3,
      featured: false,
      isActive: true,
    },
  });

  const catCarDash = await prisma.category.create({
    data: {
      name: "Dashboard & Dhikr",
      slug: "dashboard-dhikr",
      parentId: catCar.id,
      description: "Tasbeeh holders, clips, and compact reminders for daily commutes.",
      imageUrl: seedPublicUrl(SEED_IMG.carTasbeeh),
      sortOrder: 1,
      featured: false,
      isActive: true,
    },
  });

  const catHome = await prisma.category.create({
    data: {
      name: "Home & Lifestyle",
      slug: "home-lifestyle",
      description: "Prayer, fragrance, and everyday Islamic living.",
      imageUrl: seedPublicUrl(SEED_IMG.prayerMat),
      sortOrder: 4,
      featured: true,
      isActive: true,
    },
  });

  const catPrayer = await prisma.category.create({
    data: {
      name: "Prayer Essentials",
      slug: "prayer-essentials",
      parentId: catHome.id,
      description: "Prayer mats, sajjadah, and comfort-focused designs.",
      imageUrl: seedPublicUrl(SEED_IMG.prayerMat),
      sortOrder: 1,
      featured: false,
      isActive: true,
    },
  });

  const catFragrance = await prisma.category.create({
    data: {
      name: "Fragrance & Bakhoor",
      slug: "fragrance-bakhoor",
      parentId: catHome.id,
      description: "Oud burners, incense, and home fragrance inspired by tradition.",
      imageUrl: seedPublicUrl(SEED_IMG.oudBurner),
      sortOrder: 2,
      featured: false,
      isActive: true,
    },
  });

  const catGifts = await prisma.category.create({
    data: {
      name: "Gifts & Hampers",
      slug: "gifts-hampers",
      description: "Curated sets for Eid, housewarming, and Ramadan.",
      imageUrl: seedPublicUrl(SEED_IMG.giftHamper),
      sortOrder: 5,
      featured: true,
      isActive: true,
    },
  });

  const catRamadanGifts = await prisma.category.create({
    data: {
      name: "Ramadan & Eid",
      slug: "ramadan-eid-gifts",
      parentId: catGifts.id,
      description: "Dates, keepsakes, and luxury presentation boxes.",
      imageUrl: seedPublicUrl(SEED_IMG.giftHamper),
      sortOrder: 1,
      featured: true,
      isActive: true,
    },
  });

  type ProductDef = {
    sku: string;
    slug: string;
    title: string;
    shortDescription: string;
    description: string;
    regularPrice: number;
    salePrice: number | null;
    stockQuantity: number;
    featured: boolean;
    weightKg: number;
    dim: { L: number; W: number; H: number };
    tags: string[];
    attributes: Record<string, string>;
    imageFile: string;
    altText: string;
    categoryIds: string[];
    variantType?: Prisma.ProductCreateInput["variantType"];
    metaTitle: string;
    metaDescription: string;
    islamicNote: string;
  };

  const products: ProductDef[] = [
    {
      sku: "NN-VQ-101",
      slug: "luxury-velvet-quran-cover-green-13-line",
      title: "Luxury Velvet Quran Cover — Emerald Green (13 Line)",
      shortDescription: "Embossed floral motifs with gold thread piping; fits standard 13-line Arabic Quran.",
      description: `Hand-finished velvet exterior with a soft padded interior to protect the mushaf from dust and bumps. Reinforced spine, ribbon marker channel, and concealed magnetic closure keep daily use feeling premium.

Each cover is inspected for even stitching and alignment of the decorative panel. Suitable for gifting alongside a new Quran or as an upgrade to your existing copy.`,
      regularPrice: 1499,
      salePrice: 1249,
      stockQuantity: 82,
      featured: true,
      weightKg: 0.42,
      dim: { L: 28, W: 21, H: 4.5 },
      tags: ["Quran", "Ramadan Gift", "Velvet", "Green", "13 Line"],
      attributes: {
        material: "Velvet & polyester lining",
        color: "Emerald green / gold accents",
        lines: "13-line Arabic Quran",
        closure: "Magnetic",
      },
      imageFile: SEED_IMG.velvetQuran,
      altText: "Green velvet Quran cover with gold detailing",
      categoryIds: [catQuran.id, catQuranCovers.id],
      metaTitle: "Velvet Quran Cover 13 Line | NoorNest",
      metaDescription: "Premium emerald velvet Quran cover with gold embossing for 13-line mushafs.",
      islamicNote: "Designed to honour the mushaf; handle wudu-friendly surfaces before use.",
    },
    {
      sku: "NN-WA-101",
      slug: "bismillah-framed-calligraphy-gold",
      title: "Bismillah Framed Islamic Calligraphy — Gold Accent",
      shortDescription: "Statement Bismillah piece with warm gold frame — gallery-ready mounting hardware included.",
      description: `Typography-led composition on archival-quality stock, sealed behind UV-protective glazing. The frame profile is slim so the piece reads modern in living rooms, entries, or offices.

Includes wall anchors rated for the quoted weight. We recommend avoiding direct southern sun exposure to preserve gilded highlights.`,
      regularPrice: 3299,
      salePrice: 2899,
      stockQuantity: 44,
      featured: true,
      weightKg: 2.1,
      dim: { L: 62, W: 42, H: 4 },
      tags: ["Wall Art", "Bismillah", "Gold Frame", "Home"],
      attributes: {
        frame: "Composite wood, gold foil wrap",
        glazing: "UV acrylic",
        orientation: "Landscape",
      },
      imageFile: SEED_IMG.bismillahFrame,
      altText: "Framed Bismillah Islamic calligraphy in gold frame",
      categoryIds: [catWall.id, catWallFramed.id],
      variantType: "SIZE",
      metaTitle: "Bismillah Framed Wall Art | NoorNest",
      metaDescription: "Gold-framed Bismillah calligraphy for modern Islamic interiors.",
      islamicNote: "Display with respect; avoid placement in bathrooms or low-humidity unsuitable zones.",
    },
    {
      sku: "NN-CA-101",
      slug: "dashboard-wooden-tasbeeh-holder-walnut",
      title: "Dashboard Wooden Tasbeeh Holder — Compact Walnut Finish",
      shortDescription: "Anti-slip base and angled slot for standard 33-bead tasbeeh — fits most dashboards.",
      description: `CNC-cut body with a low-profile lip keeps beads from rolling while you pause at lights. Interior channel drains heat so plastic beads do not soften in summer cabins.

Use the included micro-suction pad on smooth surfaces; for textured dashes pair with our optional adhesive disc (sold separately).`,
      regularPrice: 549,
      salePrice: 449,
      stockQuantity: 160,
      featured: false,
      weightKg: 0.18,
      dim: { L: 11, W: 8, H: 5 },
      tags: ["Car", "Tasbeeh", "Dhikr", "Walnut"],
      attributes: {
        material: "Engineered wood, walnut veneer",
        finish: "Matte lacquer",
        beadCapacity: "33-bead tasbeeh",
      },
      imageFile: SEED_IMG.carTasbeeh,
      altText: "Wooden Islamic tasbeeh holder on car dashboard",
      categoryIds: [catCar.id, catCarDash.id],
      metaTitle: "Car Dashboard Tasbeeh Holder | NoorNest",
      metaDescription: "Walnut-finish dashboard dhikr holder with secure base.",
      islamicNote: "Adjust mirror and road sightlines before fixing permanently; dhikr when safe.",
    },
    {
      sku: "NN-WA-102",
      slug: "allah-muhammad-geometric-wood-plaque",
      title: "Allah & Muhammad Layered Geometric Wall Plaque",
      shortDescription: "Dual-name layered cutout with shadow-gap depth — warm maple and charcoal contrast.",
      description: `Laser-cut layers are hand-aligned for crisp geometry and bonded with archival adhesive. Mounting keyholes are countersunk so the piece hangs flush.

Pair with warm wall paint (#F5F0E8 tones) or deep teal for high contrast. Wipe with dry microfibre only.`,
      regularPrice: 1899,
      salePrice: null,
      stockQuantity: 58,
      featured: false,
      weightKg: 0.95,
      dim: { L: 45, W: 45, H: 2.2 },
      tags: ["Wall Art", "Geometric", "Allah", "Muhammad"],
      attributes: {
        material: "MDF core, maple veneer",
        depth: "Layered 22 mm",
        hardware: "Keyhole mounts",
      },
      imageFile: SEED_IMG.geometricPlaque,
      altText: "Islamic geometric Allah Muhammad wooden wall plaque",
      categoryIds: [catWall.id, catWallPlaques.id],
      metaTitle: "Geometric Allah Muhammad Plaque | NoorNest",
      metaDescription: "Layered Islamic geometric plaque with Allah and Muhammad in wood.",
      islamicNote: "Install at eye level in living spaces; not suitable for high-moisture rooms.",
    },
    {
      sku: "NN-GF-101",
      slug: "ramadan-eid-luxury-gift-hamper",
      title: "Ramadan & Eid Luxury Gift Hamper — Dates Presentation Set",
      shortDescription: "Curated flat-lay set: premium dates, glassware, and branded keepsake tray.",
      description: `Each hamper is assembled in food-grade trays with individual cello barriers for components. Replaceable date varieties rotate seasonally — Ajwa / Medjool where available.

Ideal corporate gifting with optional bulk invoice; contact support for logo sleeve add-ons (MOQ 24).`,
      regularPrice: 2499,
      salePrice: 2199,
      stockQuantity: 36,
      featured: true,
      weightKg: 3.2,
      dim: { L: 38, W: 28, H: 12 },
      tags: ["Hamper", "Ramadan", "Eid", "Dates", "Gift"],
      attributes: {
        contents: "Dates, presentation tray, decorative accent",
        shelfLife: "See batch label",
        packaging: "Reusable rigid box",
      },
      imageFile: SEED_IMG.giftHamper,
      altText: "Luxury Ramadan gift hamper with dates flat lay",
      categoryIds: [catGifts.id, catRamadanGifts.id],
      metaTitle: "Ramadan Eid Gift Hamper | NoorNest",
      metaDescription: "Luxury Islamic gift hamper with premium dates and presentation tray.",
      islamicNote: "Verify ingredients for allergens; consume dates within labelled period.",
    },
    {
      sku: "NN-QR-101",
      slug: "led-quran-speaker-bedside-lamp-white",
      title: "LED Quran Speaker & Bedside Lamp — White",
      shortDescription: "Touch dimmer Quran playback with night-light diffuser and rechargeable cell.",
      description: `Dual-driver speaker tuned for spoken recitation; app-free onboard controls for Surah shortcuts. Lamp colour temperature 2700–4000K stepless.

Includes USB-C cable (wall adapter optional). Full charge supports ~6h playback at 60% volume with lamp at low.`,
      regularPrice: 4599,
      salePrice: 4199,
      stockQuantity: 52,
      featured: true,
      weightKg: 0.88,
      dim: { L: 18, W: 18, H: 22 },
      tags: ["Quran Speaker", "LED", "Bedside", "Gift"],
      attributes: {
        connectivity: "Bluetooth + microSD",
        battery: "4800 mAh",
        colour: "Pearl white",
      },
      imageFile: SEED_IMG.quranLamp,
      altText: "White LED Quran speaker lamp on bedside",
      categoryIds: [catQuran.id, catQuranDigital.id],
      metaTitle: "LED Quran Speaker Lamp | NoorNest",
      metaDescription: "Bedside Quran speaker lamp with touch controls and warm light.",
      islamicNote: "Listen at respectful volume near prayer spaces; follow local RF rules for airports.",
    },
    {
      sku: "NN-HM-101",
      slug: "premium-woven-prayer-mat-rolled-edge",
      title: "Premium Woven Prayer Mat — Jacquard Border",
      shortDescription: "High-density weave with rolled hems; non-slip dotted underside for marble & tile.",
      description: `Yarn-dyed jacquard border resists fading under indoor light. Backing uses silicone microdots instead of full latex for easier folding travel.

Machine-wash cold on gentle once monthly max; line dry to preserve weave loft.`,
      regularPrice: 1299,
      salePrice: 999,
      stockQuantity: 120,
      featured: false,
      weightKg: 0.62,
      dim: { L: 120, W: 70, H: 0.8 },
      tags: ["Prayer Mat", "Sajjadah", "Home", "Travel Fold"],
      attributes: {
        surface: "Jacquard polyester blend",
        underside: "Silicone micro-dots",
        care: "Cold gentle wash",
      },
      imageFile: SEED_IMG.prayerMat,
      altText: "Folded premium Islamic prayer mat with pattern",
      categoryIds: [catHome.id, catPrayer.id],
      variantType: "SIZE",
      metaTitle: "Premium Woven Prayer Mat | NoorNest",
      metaDescription: "Jacquard prayer mat with non-slip backing for home or travel.",
      islamicNote: "Store rolled or flat; avoid shoes on the prayer surface.",
    },
    {
      sku: "NN-HM-102",
      slug: "brass-oud-bakhoor-burner-lattice",
      title: "Brass Oud & Bakhoor Burner — Pierced Lattice Dome",
      shortDescription: "Solid brass base with lift-off dome; sized for mabkhara charcoal discs.",
      description: `Weight-forward base reduces tip risk when removing the dome hot. Lattice pattern optimises airflow for even resin heat release.

Season with a light oil cloth after heavy use to maintain patina. Not dishwasher safe.`,
      regularPrice: 2199,
      salePrice: 1899,
      stockQuantity: 41,
      featured: false,
      weightKg: 0.74,
      dim: { L: 12, W: 12, H: 16 },
      tags: ["Oud", "Bakhoor", "Brass", "Home Fragrance"],
      attributes: {
        material: "Brass",
        fuel: "Charcoal disc + resin / bakhoor chips",
        finish: "Vintage patina",
      },
      imageFile: SEED_IMG.oudBurner,
      altText: "Vintage style brass oud bakhoor burner with dome",
      categoryIds: [catHome.id, catFragrance.id],
      metaTitle: "Brass Oud Bakhoor Burner | NoorNest",
      metaDescription: "Traditional brass bakhoor burner with pierced lattice dome.",
      islamicNote: "Use on heat-resistant surfaces; never leave burning charcoal unattended.",
    },
  ];

  const createdProducts: { id: string; sku: string; slug: string; title: string }[] = [];

  for (const p of products) {
    const prod = await prisma.product.create({
      data: {
        title: p.title,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        status: "ACTIVE",
        featured: p.featured,
        weightKg: p.weightKg,
        dimensionLengthCm: p.dim.L,
        dimensionWidthCm: p.dim.W,
        dimensionHeightCm: p.dim.H,
        variantType: p.variantType ?? null,
        attributesJson: p.attributes as Prisma.InputJsonValue,
        tagsJson: p.tags as Prisma.InputJsonValue,
        metaTitle: p.metaTitle,
        metaDescription: p.metaDescription,
        islamicComplianceNote: p.islamicNote,
        publishedAt: new Date(),
      },
    });

    await prisma.productImage.create({
      data: {
        productId: prod.id,
        imageUrl: seedPublicUrl(p.imageFile),
        altText: p.altText,
        sortOrder: 0,
        isFeatured: true,
      },
    });

    await prisma.productCategory.createMany({
      data: p.categoryIds.map((categoryId) => ({ productId: prod.id, categoryId })),
    });

    createdProducts.push({ id: prod.id, sku: p.sku, slug: prod.slug, title: prod.title });
  }

  const pWallFrame = createdProducts.find((x) => x.sku === "NN-WA-101")!;
  const pPrayerMat = createdProducts.find((x) => x.sku === "NN-HM-101")!;

  await prisma.productVariant.createMany({
    data: [
      {
        productId: pWallFrame.id,
        name: "Size",
        sku: "NN-WA-101-S",
        value: "Standard 55×40 cm",
        option1: "Standard",
        regularPrice: 2999,
        salePrice: 2649,
        stockQuantity: 22,
        isActive: true,
      },
      {
        productId: pWallFrame.id,
        name: "Size",
        sku: "NN-WA-101-L",
        value: "Large 75×50 cm",
        option1: "Large",
        regularPrice: 3799,
        salePrice: 3399,
        stockQuantity: 14,
        isActive: true,
      },
      {
        productId: pPrayerMat.id,
        name: "Size",
        sku: "NN-HM-101-R",
        value: "Regular 110×65 cm",
        option1: "Regular",
        regularPrice: 1299,
        salePrice: 999,
        stockQuantity: 70,
        isActive: true,
      },
      {
        productId: pPrayerMat.id,
        name: "Size",
        sku: "NN-HM-101-XL",
        value: "XL 130×75 cm",
        option1: "XL",
        regularPrice: 1549,
        salePrice: 1199,
        stockQuantity: 50,
        isActive: true,
      },
    ],
  });

  const pVelvet = createdProducts.find((x) => x.sku === "NN-VQ-101")!;
  const pTasbeeh = createdProducts.find((x) => x.sku === "NN-CA-101")!;
  const pPlaque = createdProducts.find((x) => x.sku === "NN-WA-102")!;
  const pHamper = createdProducts.find((x) => x.sku === "NN-GF-101")!;
  const pLamp = createdProducts.find((x) => x.sku === "NN-QR-101")!;
  const pOud = createdProducts.find((x) => x.sku === "NN-HM-102")!;

  const paidOrder = await prisma.order.create({
    data: {
      orderNumber: "NN-SEED-0001",
      userId: customer.id,
      shippingAddressId: "seed-customer-address-1",
      billingAddressId: "seed-customer-address-1",
      paymentProvider: "RAZORPAY",
      paymentStatus: "PAID",
      orderStatus: "DELIVERED",
      subtotalAmount: 1249,
      shippingChargeAmount: 60,
      taxAmount: 157.08,
      couponDiscountAmount: 0,
      totalAmount: 1466.08,
      confirmedAt: new Date(),
      shippedAt: new Date(),
      deliveredAt: new Date(),
    },
  });

  await prisma.orderItem.create({
    data: {
      orderId: paidOrder.id,
      productId: pVelvet.id,
      productTitle: pVelvet.title,
      productSlug: pVelvet.slug,
      productSku: pVelvet.sku,
      quantity: 1,
      unitPrice: 1249,
      totalPrice: 1249,
      taxRatePercent: 12,
      taxAmount: 149.88,
    },
  });

  await prisma.payment.create({
    data: {
      orderId: paidOrder.id,
      provider: "RAZORPAY",
      amount: 1466.08,
      currency: "INR",
      status: "PAID",
      razorpayOrderId: "order_seed_001",
      razorpayPaymentId: "pay_seed_001",
      razorpaySignature: "seed_signature",
      paidAt: new Date(),
    },
  });

  await prisma.shipment.create({
    data: {
      orderId: paidOrder.id,
      status: "DELIVERED",
      awbCode: "AWBSEED001",
      courierName: "Delhivery",
      trackingUrl: "https://example.com/track/AWBSEED001",
      lastSyncedAt: new Date(),
    },
  });

  await prisma.invoice.create({
    data: {
      orderId: paidOrder.id,
      invoiceNumber: "INV-SEED-0001",
      generatedAt: new Date(),
    },
  });

  const reviews: Array<{
    id: string;
    productId: string;
    userId: string | null;
    orderId: string | null;
    rating: number;
    title: string;
    comment: string;
    status: "APPROVED";
    isVerified: boolean;
  }> = [
    {
      id: "seed-review-velvet-1",
      productId: pVelvet.id,
      userId: customer.id,
      orderId: paidOrder.id,
      rating: 5,
      title: "Worth every rupee",
      comment:
        "The velvet is plush without feeling bulky, and the magnetic flap stays shut in my bag. Gifted one to my mother and ordering another.",
      status: "APPROVED",
      isVerified: true,
    },
    {
      id: "seed-review-frame-1",
      productId: pWallFrame.id,
      userId: customer2.id,
      orderId: null,
      rating: 5,
      title: "Living room centerpiece",
      comment:
        "Glass is crystal clear and the gold frame reads premium on camera. Mounting template made drilling painless.",
      status: "APPROVED",
      isVerified: false,
    },
    {
      id: "seed-review-frame-2",
      productId: pWallFrame.id,
      userId: customer.id,
      orderId: null,
      rating: 4,
      title: "Beautiful — check wall weight",
      comment: "Gorgeous piece; I used heavier anchors than suggested because of plasterboard. Looks incredible now.",
      status: "APPROVED",
      isVerified: false,
    },
    {
      id: "seed-review-tasbeeh-1",
      productId: pTasbeeh.id,
      userId: customer2.id,
      orderId: null,
      rating: 5,
      title: "Stays put on my SUV dash",
      comment: "Heat in April did not warp it. The angle is comfortable for one-hand dhikr at signals.",
      status: "APPROVED",
      isVerified: false,
    },
    {
      id: "seed-review-plaque-1",
      productId: pPlaque.id,
      userId: customer.id,
      orderId: null,
      rating: 5,
      title: "Shadow depth is subtle but classy",
      comment: "Guests always ask where it is from. Packaging prevented corner chips.",
      status: "APPROVED",
      isVerified: false,
    },
    {
      id: "seed-review-hamper-1",
      productId: pHamper.id,
      userId: customer2.id,
      orderId: null,
      rating: 5,
      title: "Corporate order hit",
      comment: "Ordered 12 for clients; branding sleeve option next time would be perfect. Dates were moist and fresh.",
      status: "APPROVED",
      isVerified: false,
    },
    {
      id: "seed-review-lamp-1",
      productId: pLamp.id,
      userId: customer.id,
      orderId: null,
      rating: 4,
      title: "Kids love the warm light",
      comment: "Reciter audio is clear. Bluetooth pairs fast; wish battery lasted a full night on max lamp + audio.",
      status: "APPROVED",
      isVerified: false,
    },
    {
      id: "seed-review-mat-1",
      productId: pPrayerMat.id,
      userId: customer2.id,
      orderId: null,
      rating: 5,
      title: "No slip on marble",
      comment: "Finally a mat that does not bunch. Washed once — colours held well on delicate cycle.",
      status: "APPROVED",
      isVerified: false,
    },
    {
      id: "seed-review-oud-1",
      productId: pOud.id,
      userId: customer.id,
      orderId: null,
      rating: 5,
      title: "Heavy base — feels safe",
      comment: "Dome lifts with a kitchen towel when hot. Patina already developing nicely after two weeks.",
      status: "APPROVED",
      isVerified: false,
    },
  ];

  for (const r of reviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      update: {
        productId: r.productId,
        userId: r.userId,
        orderId: r.orderId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        status: r.status,
        isVerified: r.isVerified,
      },
      create: r,
    });
  }

  const ratingAgg = new Map<string, { sum: number; count: number }>();
  for (const r of reviews) {
    const cur = ratingAgg.get(r.productId) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    ratingAgg.set(r.productId, cur);
  }
  for (const [productId, { sum, count }] of ratingAgg) {
    await prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: Math.round((sum / count) * 100) / 100,
        totalRatings: count,
      },
    });
  }

  const coupon = await prisma.coupon.upsert({
    where: { code: "RAMADAN20" },
    update: {
      type: "PERCENTAGE",
      value: 20,
      minimumCartValue: 1000,
      maxDiscountAmount: 500,
      status: true,
      scope: "ALL",
      usageLimitPerUser: 2,
      usageLimitTotal: 200,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    create: {
      code: "RAMADAN20",
      type: "PERCENTAGE",
      value: 20,
      minimumCartValue: 1000,
      maxDiscountAmount: 500,
      status: true,
      scope: "ALL",
      usageLimitPerUser: 2,
      usageLimitTotal: 200,
      startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.adminSetting.upsert({
    where: { groupKey_key: { groupKey: "tax", key: "enable_gst" } },
    update: { valueType: "BOOLEAN", valueJson: true },
    create: { groupKey: "tax", key: "enable_gst", valueType: "BOOLEAN", valueJson: true },
  });
  await prisma.adminSetting.upsert({
    where: { groupKey_key: { groupKey: "tax", key: "gst_rate" } },
    update: { valueType: "NUMBER", valueJson: 12 },
    create: { groupKey: "tax", key: "gst_rate", valueType: "NUMBER", valueJson: 12 },
  });
  await prisma.adminSetting.upsert({
    where: { groupKey_key: { groupKey: "seo", key: "default_meta_title" } },
    update: { valueType: "STRING", valueJson: "NoorNest - Premium Islamic Store" },
    create: {
      groupKey: "seo",
      key: "default_meta_title",
      valueType: "STRING",
      valueJson: "NoorNest - Premium Islamic Store",
    },
  });

  await prisma.heroSlide.upsert({
    where: { id: "seed-hero-1" },
    update: {
      title: "Curated for Faith & Home",
      subtitle: "Velvet Qurans, framed ayat, hampers, and more — shipped with care.",
      buttonText: "Shop collection",
      buttonLink: "/products",
      desktopImageUrl: seedPublicUrl(SEED_IMG.bismillahFrame),
      sortOrder: 0,
      isActive: true,
    },
    create: {
      id: "seed-hero-1",
      title: "Curated for Faith & Home",
      subtitle: "Velvet Qurans, framed ayat, hampers, and more — shipped with care.",
      buttonText: "Shop collection",
      buttonLink: "/products",
      desktopImageUrl: seedPublicUrl(SEED_IMG.bismillahFrame),
      sortOrder: 0,
      isActive: true,
    },
  });

  const section = await prisma.homepageSection.upsert({
    where: { slug: "best-sellers" },
    update: {
      title: "Customer favourites",
      subtitle: "Most‑loved pieces this season",
      productsToShow: 6,
      isActive: true,
      type: "CUSTOM",
      sortOrder: 1,
    },
    create: {
      title: "Customer favourites",
      subtitle: "Most‑loved pieces this season",
      slug: "best-sellers",
      type: "CUSTOM",
      productsToShow: 6,
      sortOrder: 1,
      isActive: true,
    },
  });

  await prisma.homepageSectionProduct.createMany({
    data: [
      { sectionId: section.id, productId: pVelvet.id, sortOrder: 0 },
      { sectionId: section.id, productId: pWallFrame.id, sortOrder: 1 },
      { sectionId: section.id, productId: pHamper.id, sortOrder: 2 },
      { sectionId: section.id, productId: pLamp.id, sortOrder: 3 },
      { sectionId: section.id, productId: pPrayerMat.id, sortOrder: 4 },
      { sectionId: section.id, productId: pTasbeeh.id, sortOrder: 5 },
    ],
  });

  console.log("Seed complete");
  console.log("Admin:", admin.email, "password: Admin@123");
  console.log("Customer:", customer.email, "password: Customer@123");
  console.log("Customer 2:", customer2.email, "password: Customer@123");
  console.log("Coupon:", coupon.code);
  console.log("Products:", createdProducts.length, "— images at /uploads/seed/");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
