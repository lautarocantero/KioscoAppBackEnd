/*──────────────────────────────
🌱 seedDemoData
──────────────────────────────
📜 Propósito:
Script MANUAL (no corre en el boot de la app) para poblar la base con una
cuenta real + datos ficticios de demo: usuario dueño, kiosco (plan free =
Standard, el default), empleados ficticios y 40 ventas ficticias.

▶️ Parcialmente idempotente: si el email del dueño ya existe, reusa esa
   cuenta en vez de fallar. Si ya tiene un kiosco con el mismo nombre, lo
   reusa. Los 40 sells se agregan siempre (correrlo dos veces duplica ventas).

🖥️ Uso:
   npx ts-node src/scripts/seedDemoData.ts
──────────────────────────────*/

import 'dotenv/config';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { SALT_ROUNDS } from '../config';
import { AuthSchema } from '../schemas/authSchema';
import { SellerSchema } from '../schemas/sellerSchema';
import { KioscoSchema } from '../schemas/kioscoSchema';
import { KioscoMembershipSchema } from '../schemas/kioscoMembershipSchema';
import { ProductMongo } from '../schemas/productSchema';
import { PresentationMongo } from '../schemas/presentationSchema';
import { SellSchema } from '../schemas/sellSchema';
import { AuthRoleEnum } from '../typings/auth/enums';
import { SellerStatus } from '../typings/seller/sellerEnums';
import { ModelType, ModelUnit, PresentationCategory } from '../typings/presentation/presentationEnum';

const OWNER_EMAIL = 'lautaroncantero@gmail.com';
const OWNER_PASSWORD = 'E$uAP`O%0,~+JtA';
const OWNER_NAME = 'Lautaro';

const KIOSCO_NAME = 'Kiosco San Martín';
const KIOSCO_ADDRESS = 'Av. San Martín 1450, CABA';

const EMPLOYEE_PASSWORD = 'Empleado#2026';
const EMPLOYEES = [
    { name: 'Martín Gómez', email: 'martin.gomez@kiosco-demo.com' },
    { name: 'Sofía Ramírez', email: 'sofia.ramirez@kiosco-demo.com' },
    { name: 'Nicolás Torres', email: 'nicolas.torres@kiosco-demo.com' },
];

type CatalogSeed = {
    name: string;
    brand: string;
    category: PresentationCategory;
    model_type: ModelType;
    model_size: number;
    model_unit: ModelUnit;
    price: number;
    stock: number;
};

const CATALOG: CatalogSeed[] = [
    { name: 'Coca-Cola', brand: 'Coca-Cola', category: PresentationCategory.NonAlcoholicBeverages, model_type: ModelType.Bottle, model_size: 500, model_unit: ModelUnit.Milliliters, price: 1500, stock: 60 },
    { name: 'Sprite', brand: 'Coca-Cola', category: PresentationCategory.NonAlcoholicBeverages, model_type: ModelType.Bottle, model_size: 500, model_unit: ModelUnit.Milliliters, price: 1500, stock: 45 },
    { name: 'Agua Villavicencio', brand: 'Villavicencio', category: PresentationCategory.NonAlcoholicBeverages, model_type: ModelType.Bottle, model_size: 500, model_unit: ModelUnit.Milliliters, price: 900, stock: 80 },
    { name: 'Alfajor Jorgito', brand: 'Jorgito', category: PresentationCategory.CookiesAndPastries, model_type: ModelType.Sachet, model_size: 1, model_unit: ModelUnit.Units, price: 800, stock: 100 },
    { name: 'Papas Fritas Lays', brand: 'Lays', category: PresentationCategory.Snacks, model_type: ModelType.Bag, model_size: 45, model_unit: ModelUnit.Grams, price: 1200, stock: 70 },
    { name: 'Chicles Beldent', brand: 'Beldent', category: PresentationCategory.Snacks, model_type: ModelType.Blister, model_size: 1, model_unit: ModelUnit.Units, price: 500, stock: 120 },
    { name: 'Cigarrillos Marlboro', brand: 'Marlboro', category: PresentationCategory.TobaccoAndCigarettes, model_type: ModelType.Box, model_size: 20, model_unit: ModelUnit.Units, price: 4200, stock: 40 },
    { name: 'Café La Virginia', brand: 'La Virginia', category: PresentationCategory.HotBeverages, model_type: ModelType.Jar, model_size: 170, model_unit: ModelUnit.Grams, price: 2800, stock: 25 },
    { name: 'Cuaderno Rivadavia', brand: 'Rivadavia', category: PresentationCategory.StationeryAndKiosk, model_type: ModelType.Other, model_size: 1, model_unit: ModelUnit.Units, price: 3500, stock: 30 },
    { name: 'Lapicera Bic', brand: 'Bic', category: PresentationCategory.StationeryAndKiosk, model_type: ModelType.Other, model_size: 1, model_unit: ModelUnit.Units, price: 700, stock: 90 },
    { name: 'Jabón Dove', brand: 'Dove', category: PresentationCategory.PersonalHygiene, model_type: ModelType.Other, model_size: 90, model_unit: ModelUnit.Grams, price: 2200, stock: 35 },
    { name: 'Chocolate Milka', brand: 'Milka', category: PresentationCategory.Snacks, model_type: ModelType.Other, model_size: 100, model_unit: ModelUnit.Grams, price: 2600, stock: 50 },
];

const PAYMENT_METHODS = ['cash', 'debit', 'credit', 'transfer'];

function isoNow(): string {
    return new Date().toISOString();
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
}

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
}

async function ensureOwner(): Promise<string> {
    const existing = await AuthSchema.findOne({ email: OWNER_EMAIL }).lean();
    if (existing) {
        console.log(`⏭️  Auth ya existe para ${OWNER_EMAIL} (_id=${existing._id}) — se reusa, no se toca password.`);
        return existing._id as string;
    }

    const _id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, SALT_ROUNDS);
    const now = isoNow();

    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            await AuthSchema.create([{
                _id,
                email: OWNER_EMAIL,
                password: hashedPassword,
                refreshToken: '',
                isVerified: true,
            }], { session });

            await SellerSchema.create([{
                _id,
                name: OWNER_NAME,
                profilePhoto: '',
                created_at: now,
                user_status: SellerStatus.offline,
            }], { session });
        });
    } finally {
        session.endSession();
    }

    console.log(`✅ Usuario dueño creado: ${OWNER_EMAIL} (_id=${_id})`);
    return _id;
}

function generateInviteCode(): string {
    return crypto.randomBytes(6).toString('base64url').toUpperCase().slice(0, 8);
}

async function ensureKiosco(ownerId: string): Promise<string> {
    const existing = await KioscoSchema.findOne({ owner_id: ownerId, name: KIOSCO_NAME }).lean();
    if (existing) {
        console.log(`⏭️  Kiosco "${KIOSCO_NAME}" ya existe (_id=${existing._id}) — se reusa.`);
        return existing._id as string;
    }

    const _id = crypto.randomUUID();
    const now = isoNow();

    await KioscoSchema.create({
        _id,
        name: KIOSCO_NAME,
        address: KIOSCO_ADDRESS,
        owner_id: ownerId,
        invite_code: generateInviteCode(),
        currency: 'ARS',
        created_at: now,
        updated_at: now,
    });

    await KioscoMembershipSchema.create({
        _id: crypto.randomUUID(),
        kiosco_id: _id,
        user_id: ownerId,
        role: AuthRoleEnum.Admin,
        joined_at: now,
        last_accessed_at: now,
    });

    console.log(`✅ Kiosco creado: "${KIOSCO_NAME}" (_id=${_id}, plan=standard/free por default)`);
    return _id;
}

async function ensureEmployees(kioscoId: string): Promise<{ _id: string; name: string }[]> {
    const hashedPassword = await bcrypt.hash(EMPLOYEE_PASSWORD, SALT_ROUNDS);
    const now = isoNow();
    const result: { _id: string; name: string }[] = [];

    for (const employee of EMPLOYEES) {
        const existing = await AuthSchema.findOne({ email: employee.email }).lean();
        if (existing) {
            console.log(`⏭️  Empleado ya existe: ${employee.email} (_id=${existing._id})`);
            const membership = await KioscoMembershipSchema.findOne({ kiosco_id: kioscoId, user_id: existing._id }).lean();
            if (!membership) {
                await KioscoMembershipSchema.create({
                    _id: crypto.randomUUID(),
                    kiosco_id: kioscoId,
                    user_id: existing._id,
                    role: AuthRoleEnum.Seller,
                    joined_at: now,
                    last_accessed_at: now,
                });
            }
            result.push({ _id: existing._id as string, name: employee.name });
            continue;
        }

        const _id = crypto.randomUUID();

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await AuthSchema.create([{
                    _id,
                    email: employee.email,
                    password: hashedPassword,
                    refreshToken: '',
                    isVerified: true,
                }], { session });

                await SellerSchema.create([{
                    _id,
                    name: employee.name,
                    profilePhoto: '',
                    created_at: now,
                    user_status: SellerStatus.offline,
                }], { session });

                await KioscoMembershipSchema.create([{
                    _id: crypto.randomUUID(),
                    kiosco_id: kioscoId,
                    user_id: _id,
                    role: AuthRoleEnum.Seller,
                    joined_at: now,
                    last_accessed_at: now,
                }], { session });
            });
        } finally {
            session.endSession();
        }

        console.log(`✅ Empleado ficticio creado: ${employee.name} <${employee.email}> (_id=${_id})`);
        result.push({ _id, name: employee.name });
    }

    return result;
}

type CatalogEntry = {
    product_id: string;
    presentation_id: string;
    name: string;
    description: string;
    image_url: string;
    brand: string;
    sku: string;
    model_type: string;
    model_size: number;
    model_unit: string;
    price: number;
    stock: number;
};

async function ensureCatalog(kioscoId: string): Promise<CatalogEntry[]> {
    const existingPresentations = await PresentationMongo.find({ kiosco_id: kioscoId }).lean();
    if (existingPresentations.length > 0) {
        console.log(`⏭️  El kiosco ya tiene ${existingPresentations.length} presentaciones — se reusan para las ventas.`);
        return existingPresentations.map((p) => ({
            product_id: p.product_id,
            presentation_id: p._id,
            name: p.name,
            description: p.description ?? '',
            image_url: p.image_url ?? '',
            brand: p.brand ?? '',
            sku: p.sku,
            model_type: p.model_type ?? 'other',
            model_size: p.model_size ?? 1,
            model_unit: p.model_unit ?? 'units',
            price: p.price,
            stock: p.stock,
        })) as unknown as CatalogEntry[];
    }

    const now = isoNow();
    const entries: CatalogEntry[] = [];

    for (let i = 0; i < CATALOG.length; i++) {
        const item = CATALOG[i];
        const productId = crypto.randomUUID();
        const presentationId = crypto.randomUUID();
        const sku = `SKU-${String(i + 1).padStart(4, '0')}`;

        await ProductMongo.create({
            _id: productId,
            kiosco_id: kioscoId,
            name: item.name,
            description: '',
            created_at: now,
            updated_at: now,
            image_url: '',
            brand: item.brand,
        });

        await PresentationMongo.create({
            _id: presentationId,
            kiosco_id: kioscoId,
            product_id: productId,
            sku,
            barcode: '',
            name: item.name,
            description: '',
            brand: item.brand,
            model_type: item.model_type,
            model_size: item.model_size,
            model_unit: item.model_unit,
            category: [item.category],
            sale_type: 'unit',
            image_url: '',
            price: item.price,
            stock: item.stock,
            min_stock: Math.max(5, Math.floor(item.stock * 0.1)),
            status: 'available',
            created_at: now,
            updated_at: now,
            is_perishable: false,
            expiration_date: '',
        });

        entries.push({
            product_id: productId,
            presentation_id: presentationId,
            name: item.name,
            description: '',
            image_url: '',
            brand: item.brand,
            sku,
            model_type: item.model_type,
            model_size: item.model_size,
            model_unit: item.model_unit,
            price: item.price,
            stock: item.stock,
        });
    }

    console.log(`✅ Catálogo ficticio creado: ${entries.length} productos con su presentación.`);
    return entries;
}

async function createFakeSells(
    kioscoId: string,
    sellers: { _id: string; name: string }[],
    catalog: CatalogEntry[],
    count: number,
): Promise<void> {
    const now = isoNow();

    for (let i = 0; i < count; i++) {
        const seller = randomChoice(sellers);
        const itemsInSell = randomInt(1, 4);
        const chosenPresentations = new Set<number>();
        while (chosenPresentations.size < Math.min(itemsInSell, catalog.length)) {
            chosenPresentations.add(randomInt(0, catalog.length - 1));
        }

        const products = Array.from(chosenPresentations).map((idx) => {
            const entry = catalog[idx];
            const quantity = randomInt(1, 3);
            return {
                _id: entry.presentation_id,
                product_id: entry.product_id,
                name: entry.name,
                description: entry.description,
                image_url: entry.image_url,
                brand: entry.brand,
                sku: entry.sku,
                model_type: entry.model_type,
                model_size: String(entry.model_size),
                price: entry.price,
                expiration_date: '',
                stock_required: quantity,
                stock: entry.stock,
            };
        });

        const subTotal = products.reduce((sum, p) => sum + p.price * p.stock_required, 0);

        // Ventas repartidas en los últimos 30 días, alguna hora random del día.
        const daysAgo = randomInt(0, 29);
        const purchaseDate = new Date(now);
        purchaseDate.setDate(purchaseDate.getDate() - daysAgo);
        purchaseDate.setHours(randomInt(8, 21), randomInt(0, 59), randomInt(0, 59), 0);

        await SellSchema.create({
            _id: crypto.randomUUID(),
            kiosco_id: kioscoId,
            currency: 'ARS',
            iva: 0,
            modification_date: '',
            payment_method: randomChoice(PAYMENT_METHODS),
            products,
            purchase_date: formatDate(purchaseDate),
            seller_id: seller._id,
            seller_name: seller.name,
            sub_total: subTotal,
            total_amount: subTotal,
            status: 'completada',
            amount_paid: null,
            debtor_name: null,
            settles_sell_id: null,
            createdAt: purchaseDate,
            updatedAt: purchaseDate,
        });
    }

    console.log(`✅ ${count} ventas ficticias creadas.`);
}

async function main(): Promise<void> {
    await connectDB();

    const ownerId = await ensureOwner();
    const kioscoId = await ensureKiosco(ownerId);
    const employees = await ensureEmployees(kioscoId);
    const catalog = await ensureCatalog(kioscoId);

    const sellers = [{ _id: ownerId, name: OWNER_NAME }, ...employees];
    await createFakeSells(kioscoId, sellers, catalog, 40);

    console.log('\n──────── Resumen ────────');
    console.log(`Dueño:   ${OWNER_EMAIL} / password provista por el usuario`);
    console.log(`Kiosco:  ${KIOSCO_NAME} (_id=${kioscoId})`);
    console.log(`Empleados (password: ${EMPLOYEE_PASSWORD}):`);
    for (const e of employees) console.log(`  - ${e.name} <${EMPLOYEES.find((x) => x.name === e.name)?.email}>`);
    console.log('Ventas:  40 ficticias, últimos 30 días');

    await mongoose.disconnect();
}

main().catch((error) => {
    console.error('❌ Error en seedDemoData:', error);
    process.exit(1);
});
