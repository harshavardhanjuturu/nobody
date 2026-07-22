const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = 'file:' + path.join(__dirname, 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database with KC Hotel menu and Indian collegiate mock data...');

  // Clean existing transactional data, keeping registered user accounts
  await prisma.skillPost.deleteMany({});
  await prisma.freelanceProject.deleteMany({});
  await prisma.marketplaceItem.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.communityGroup.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.foodItem.deleteMany({});

  // Upsert core demo users without wiping real registered users
  const alex = await prisma.user.upsert({
    where: { phoneNumber: "+919876543210" },
    update: {},
    create: {
      phoneNumber: "+919876543210",
      email: "alex.parker@university.edu",
      name: "Alex Parker",
      role: "student",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150"
    }
  });

  const sarah = await prisma.user.upsert({
    where: { phoneNumber: "+918765432109" },
    update: {},
    create: {
      phoneNumber: "+918765432109",
      email: "sarah.jenkins@university.edu",
      name: "Sarah Jenkins",
      role: "student",
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
    }
  });

  console.log('Created core users:', alex.name, ',', sarah.name);

  // Create Social Posts
  await prisma.post.createMany({
    data: [
      {
        content: "Just finished CS 301 Assignment 4! That red-black tree implementation was brutal but so satisfying.",
        likes: 12,
        userId: alex.id
      },
      {
        content: "Looking for a photographer for our club event this Friday. Hit me up if you have a camera and some free time!",
        likes: 8,
        userId: sarah.id
      },
      {
        content: "The sunset at the quad today was absolutely stunning. Premium vibes only on campus.",
        likes: 42,
        userId: alex.id
      }
    ]
  });

  // =============================================
  // KC HOTEL MENU ITEMS (New KC Tasty - Full Menu)
  // =============================================

  const kcItems = [
    // --- NOODLES VARIETIES ---
    { name: "Veg Noodles", description: "Classic stir-fried vegetable noodles tossed with fresh veggies and sauces.", price: 60, category: "Noodles", hotelName: "KC" },
    { name: "Gobi Noodles", description: "Crispy cauliflower florets tossed with noodles in a savory sauce.", price: 70, category: "Noodles", hotelName: "KC" },
    { name: "Paneer Noodles", description: "Soft paneer cubes stir-fried with noodles and mixed vegetables.", price: 70, category: "Noodles", hotelName: "KC" },
    { name: "Schezwan Noodles", description: "Spicy Schezwan sauce noodles with mixed vegetables.", price: 70, category: "Noodles", hotelName: "KC" },
    { name: "Schezwan Gobi Noodles", description: "Gobi (cauliflower) noodles in fiery Schezwan sauce.", price: 75, category: "Noodles", hotelName: "KC" },
    { name: "Schezwan Paneer Noodles", description: "Paneer noodles in bold Schezwan spice.", price: 75, category: "Noodles", hotelName: "KC" },
    { name: "Schezwan Mushroom Noodles", description: "Mushroom noodles in spicy Schezwan sauce.", price: 75, category: "Noodles", hotelName: "KC" },
    { name: "Veg Manchurian Noodles", description: "Noodles topped with crispy vegetable Manchurian balls in gravy.", price: 75, category: "Noodles", hotelName: "KC" },
    { name: "Paneer Manchurian Noodles", description: "Noodles with paneer Manchurian in Indo-Chinese sauce.", price: 85, category: "Noodles", hotelName: "KC" },
    { name: "Gobi Manchurian Noodles", description: "Noodles with gobi Manchurian in tangy sauce.", price: 85, category: "Noodles", hotelName: "KC" },
    { name: "Mushroom Manchurian Noodles", description: "Noodles with mushroom Manchurian in savory sauce.", price: 85, category: "Noodles", hotelName: "KC" },

    // --- SPL LAPPA VARIETIES ---
    { name: "Plain Lappa", description: "Simple, soft wheat lappa served plain.", price: 40, category: "Lappa", hotelName: "KC" },
    { name: "Onion Lappa", description: "Lappa filled with seasoned onions.", price: 60, category: "Lappa", hotelName: "KC" },
    { name: "Paneer Lappa", description: "Lappa stuffed with spiced paneer filling.", price: 70, category: "Lappa", hotelName: "KC" },
    { name: "Gobi Lappa", description: "Lappa filled with spiced cauliflower.", price: 70, category: "Lappa", hotelName: "KC" },
    { name: "Babycorn Lappa", description: "Lappa with baby corn stir-fry filling.", price: 70, category: "Lappa", hotelName: "KC" },
    { name: "Channa Lappa", description: "Lappa stuffed with spiced chickpeas.", price: 70, category: "Lappa", hotelName: "KC" },
    { name: "Cheese Lappa", description: "Lappa filled with melted cheese.", price: 70, category: "Lappa", hotelName: "KC" },
    { name: "Cheese Corn Lappa", description: "Lappa filled with cheese and sweet corn.", price: 80, category: "Lappa", hotelName: "KC" },
    { name: "Palakkasi Lappa", description: "Lappa with palak (spinach) and spices.", price: 75, category: "Lappa", hotelName: "KC" },
    { name: "Brocoli Lappa", description: "Lappa filled with fresh broccoli and seasoning.", price: 75, category: "Lappa", hotelName: "KC" },
    { name: "Mushroom Lappa", description: "Lappa stuffed with sautéed mushrooms.", price: 70, category: "Lappa", hotelName: "KC" },
    { name: "Maai Maker Lappa", description: "Special mixed filling lappa.", price: 70, category: "Lappa", hotelName: "KC" },
    { name: "Mixed Veg Lappa", description: "Lappa with assorted mixed vegetables.", price: 70, category: "Lappa", hotelName: "KC" },

    // --- KC'S BRIYANI VARIETIES ---
    { name: "KC's Spl Briyani", description: "KC's special biryani – aromatic basmati rice with signature spices.", price: 75, category: "Briyani", hotelName: "KC" },
    { name: "Paneer Briyani", description: "Fragrant basmati rice cooked with soft paneer and whole spices.", price: 85, category: "Briyani", hotelName: "KC" },
    { name: "Gobi Briyani", description: "Basmati rice slow-cooked with tender cauliflower and spices.", price: 85, category: "Briyani", hotelName: "KC" },
    { name: "Babycorn Briyani", description: "Aromatic biryani with baby corn and fragrant spices.", price: 80, category: "Briyani", hotelName: "KC" },
    { name: "Brocoli Briyani", description: "Healthy broccoli biryani with basmati rice.", price: 80, category: "Briyani", hotelName: "KC" },
    { name: "Palakkasi Briyani", description: "Spinach-infused biryani with basmati rice.", price: 80, category: "Briyani", hotelName: "KC" },
    { name: "Mushroom Briyani", description: "Mushroom biryani with aromatic spices and basmati rice.", price: 85, category: "Briyani", hotelName: "KC" },

    // --- GRAVY VARIETIES ---
    { name: "Paneer Butter Masala", description: "Rich tomato-based creamy gravy with soft paneer cubes.", price: 65, category: "Gravy", hotelName: "KC" },
    { name: "Chilly Paneer Gravy", description: "Crispy paneer in a tangy Indo-Chinese chilli sauce.", price: 85, category: "Gravy", hotelName: "KC" },
    { name: "Gobi Manchurian Gravy", description: "Crispy cauliflower in a savoury Manchurian sauce.", price: 65, category: "Gravy", hotelName: "KC" },
    { name: "Chilly Gobi Gravy", description: "Cauliflower florets in spicy chilli sauce.", price: 65, category: "Gravy", hotelName: "KC" },
    { name: "Gobi Masala", description: "Cauliflower in aromatic Indian spiced masala gravy.", price: 55, category: "Gravy", hotelName: "KC" },
    { name: "Alugobi Masala", description: "Potato and cauliflower cooked in spiced masala gravy.", price: 65, category: "Gravy", hotelName: "KC" },
    { name: "Alu Masala", description: "Potato cubes in spiced tomato-onion masala gravy.", price: 65, category: "Gravy", hotelName: "KC" },
    { name: "Kadai Paneer", description: "Paneer cooked with bell peppers in a robust kadai masala.", price: 75, category: "Gravy", hotelName: "KC" },
    { name: "Palak Paneer", description: "Soft paneer in a smooth, creamy spinach gravy.", price: 75, category: "Gravy", hotelName: "KC" },
    { name: "Mixed Veg", description: "Assorted vegetables in a spiced Indian gravy.", price: 75, category: "Gravy", hotelName: "KC" },
    { name: "Cashewnut Masala", description: "Cashew nuts in a rich, creamy masala sauce.", price: 80, category: "Gravy", hotelName: "KC" },
    { name: "Malai Kofta", description: "Deep-fried paneer-potato balls in a velvety cream sauce.", price: 125, category: "Gravy", hotelName: "KC" },
    { name: "Mushroom Manchurian", description: "Mushrooms in tangy Manchurian sauce.", price: 70, category: "Gravy", hotelName: "KC" },
    { name: "Mushroom Masala", description: "Mushrooms cooked in a spiced Indian masala gravy.", price: 70, category: "Gravy", hotelName: "KC" },
    { name: "Alu Kofta", description: "Spiced potato balls in a rich, aromatic gravy.", price: 120, category: "Gravy", hotelName: "KC" },
    { name: "Veg Bell Manchurian", description: "Bell pepper Manchurian in a tangy Indo-Chinese sauce.", price: 100, category: "Gravy", hotelName: "KC" },
    { name: "Alu Mutter", description: "Green peas and potatoes in a spiced tomato-onion gravy.", price: 70, category: "Gravy", hotelName: "KC" },
    { name: "Babycorn Manchurian", description: "Baby corn in savoury Manchurian sauce.", price: 70, category: "Gravy", hotelName: "KC" },
    { name: "Paneer Chetinadu Gravy", description: "Paneer in bold, aromatic Chettinad spice gravy.", price: 85, category: "Gravy", hotelName: "KC" },
    { name: "Gobi Chetinadu Gravy", description: "Cauliflower in pungent Chettinad masala.", price: 85, category: "Gravy", hotelName: "KC" },
    { name: "Mushroom Chetinadu Gravy", description: "Mushrooms in spicy Chettinad sauce.", price: 85, category: "Gravy", hotelName: "KC" },
    { name: "Paneer Korma", description: "Paneer in mild, creamy korma sauce with cashews.", price: 85, category: "Gravy", hotelName: "KC" },
    { name: "Paneer Manchurian Gravy", description: "Paneer in savoury Manchurian sauce.", price: 80, category: "Gravy", hotelName: "KC" },
    { name: "Kaju Paneer Masala", description: "Cashews and paneer in a rich masala gravy.", price: 90, category: "Gravy", hotelName: "KC" },
    { name: "Babycorn Masala", description: "Baby corn in spiced Indian masala.", price: 75, category: "Gravy", hotelName: "KC" },
    { name: "Greenpeas Masala", description: "Green peas in a fragrant spiced masala.", price: 75, category: "Gravy", hotelName: "KC" },
    { name: "Dali Fry", description: "Yellow lentils tempered with cumin, mustard, and spices.", price: 65, category: "Gravy", hotelName: "KC" },
    { name: "Paneer Tikka Gravy", description: "Grilled paneer tikka in a smoky tandoori gravy.", price: 100, category: "Gravy", hotelName: "KC" },

    // --- NORTH INDIAN PARATHA ---
    { name: "Alu Paratha", description: "Whole wheat flatbread stuffed with spiced mashed potato.", price: 55, category: "Paratha", hotelName: "KC" },
    { name: "Sweet Paratha", description: "Soft whole wheat paratha with a hint of sweetness.", price: 55, category: "Paratha", hotelName: "KC" },
    { name: "Sade Paratha", description: "Plain whole wheat paratha, simple and wholesome.", price: 55, category: "Paratha", hotelName: "KC" },
    { name: "Pudhina Paratha", description: "Mint-flavored whole wheat paratha.", price: 55, category: "Paratha", hotelName: "KC" },
    { name: "Onion Paratha", description: "Crispy whole wheat paratha stuffed with onion and spices.", price: 60, category: "Paratha", hotelName: "KC" },
    { name: "Gobi Paratha", description: "Whole wheat paratha stuffed with spiced cauliflower.", price: 60, category: "Paratha", hotelName: "KC" },
    { name: "Paneer Paratha", description: "Whole wheat paratha stuffed with fresh paneer and spices.", price: 65, category: "Paratha", hotelName: "KC" },

    // --- SPL DOSAI VARIETIES ---
    { name: "Tomato Dosai", description: "Crispy dosa flavored with fresh tomato chutney on top.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Palakkaai Dosai", description: "Dosa with a jackfruit inspired filling.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Brocoli Dosai", description: "Crispy dosa topped with broccoli filling.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Spl Dosai Vadacurry", description: "Special dosa served with vada curry on the side.", price: 60, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Mayo Dosai", description: "Dosa with melted cheese and creamy mayo.", price: 90, category: "Dosai", hotelName: "KC" },
    { name: "5 Taste Oothappam", description: "Five-flavored thick oothappam loaded with toppings.", price: 80, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Peas Dosai", description: "Dosa with melted cheese and green peas filling.", price: 80, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Peas Oothappam", description: "Thick oothappam with cheese and peas.", price: 80, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Paneer Dosai", description: "Dosa filled with cheese and fresh paneer.", price: 80, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Mushroom Dosai", description: "Dosa with cheese and sautéed mushrooms.", price: 80, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Corn Dosai", description: "Dosa topped with cheese and sweet corn.", price: 80, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Corn Oothappam", description: "Thick oothappam with cheese and corn.", price: 80, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Gobi Dosai", description: "Dosa filled with cheese and spiced cauliflower.", price: 80, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Gobi Dosai", description: "Ghee-roasted dosa with gobi filling.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Podi Onion Dosai", description: "Crispy ghee dosa with podi powder and onions.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Mysore Masala Dosai", description: "Crispy dosa with Mysore chutney and potato masala filling.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Gobi Dosai", description: "Classic crispy dosa stuffed with spiced gobi.", price: 65, category: "Dosai", hotelName: "KC" },
    { name: "Brinjal Kosthu Dosai", description: "Dosa with tangy brinjal kosthu accompaniment.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Veg Oothappam", description: "Thick rice pancake topped with mixed vegetables.", price: 60, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Masala Dosai", description: "Crispy ghee dosa with spiced potato masala.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Onion Podi Oothappam", description: "Oothappam with ghee, onion and podi.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Podi Oothappam", description: "Thick oothappam with ghee and podi powder.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Podi Dosai", description: "Crispy dosa with podi and ghee.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Onion Dosai", description: "Dosa with ghee and caramelized onions.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Onion Oothappam", description: "Oothappam with ghee and onion topping.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Plain Paneer Dosai", description: "Simple dosa with a plain paneer filling.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Mushroom Dosai", description: "Dosa with ghee and sautéed mushrooms.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Ghee Oothappam", description: "Classic thick oothappam drizzled with ghee.", price: 65, category: "Dosai", hotelName: "KC" },
    { name: "Chilly Garlic Dosai", description: "Spicy dosa with chilli and garlic toppings.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Babycorn Dosai", description: "Dosa filled with baby corn masala.", price: 70, category: "Dosai", hotelName: "KC" },
    { name: "Podi Oothappam", description: "Thick oothappam dusted with gun powder (podi).", price: 60, category: "Dosai", hotelName: "KC" },
    { name: "Podi Onion Oothappam", description: "Oothappam with podi and onion.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Podi Onion Dosai", description: "Crispy dosa with podi and onion.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Mushroom Masala Dosai", description: "Dosa stuffed with mushroom masala.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Cheese Podi Onion Dosai", description: "Dosa with cheese, podi, and onion.", price: 75, category: "Dosai", hotelName: "KC" },
    { name: "Pizza Dosai", description: "Dosa with pizza-style toppings – cheese, veggies, and sauce.", price: 80, category: "Dosai", hotelName: "KC" },

    // --- RAVA VARIETIES ---
    { name: "Rava Dosai", description: "Thin, crispy semolina crepe.", price: 50, category: "Rava", hotelName: "KC" },
    { name: "Ghee Onion Rava", description: "Semolina dosa with ghee and onion.", price: 70, category: "Rava", hotelName: "KC" },
    { name: "Rava Masala", description: "Semolina dosa with potato masala filling.", price: 70, category: "Rava", hotelName: "KC" },
    { name: "Ghee Rava Masala", description: "Ghee-drenched semolina dosa with masala.", price: 75, category: "Rava", hotelName: "KC" },
    { name: "Onion Rava Dosai", description: "Crispy rava dosa topped with fresh onions.", price: 65, category: "Rava", hotelName: "KC" },
    { name: "Ghee Rava", description: "Classic semolina dosa with generous ghee.", price: 70, category: "Rava", hotelName: "KC" },
    { name: "Cheese Rava Masala", description: "Rava dosa with cheese and potato masala.", price: 80, category: "Rava", hotelName: "KC" },

    // --- INDIAN ROTIS ---
    { name: "Chapathy", description: "Soft whole wheat flatbread, a staple Indian bread.", price: 40, category: "Rotis", hotelName: "KC" },
    { name: "Parotta", description: "Flaky, layered South Indian parotta.", price: 35, category: "Rotis", hotelName: "KC" },
    { name: "Tandoori Alu Barotta", description: "Barotta stuffed with spiced potato, tandoori style.", price: 55, category: "Rotis", hotelName: "KC" },
    { name: "Plain Naan", description: "Soft leavened bread baked in a tandoor.", price: 40, category: "Rotis", hotelName: "KC" },
    { name: "Butter Naan", description: "Soft naan brushed generously with butter.", price: 45, category: "Rotis", hotelName: "KC" },
    { name: "Roti", description: "Soft whole wheat Indian flatbread.", price: 25, category: "Rotis", hotelName: "KC" },
    { name: "Butter Roti", description: "Soft roti with a pat of fresh butter.", price: 28, category: "Rotis", hotelName: "KC" },
    { name: "Lacha Parotta", description: "Multi-layered, flaky parotta.", price: 40, category: "Rotis", hotelName: "KC" },
    { name: "Butter Kulcha", description: "Soft leavened bread with butter.", price: 50, category: "Rotis", hotelName: "KC" },
    { name: "Pulka", description: "Thin, puffed whole wheat bread.", price: 18, category: "Rotis", hotelName: "KC" },
    { name: "Paneer Kulcha", description: "Soft kulcha stuffed with spiced paneer.", price: 60, category: "Rotis", hotelName: "KC" },
    { name: "Garlic Naan", description: "Naan topped with garlic and butter.", price: 55, category: "Rotis", hotelName: "KC" },
    { name: "Cheese Naan", description: "Naan stuffed with melted cheese.", price: 55, category: "Rotis", hotelName: "KC" },
    { name: "Onion Naan", description: "Naan topped with caramelized onions.", price: 50, category: "Rotis", hotelName: "KC" },
    { name: "Tandoori Paneer Roti", description: "Tandoor-baked roti stuffed with spiced paneer.", price: 60, category: "Rotis", hotelName: "KC" },
    { name: "Chola Poori", description: "Deep-fried fluffy poori served with spiced chickpea curry.", price: 60, category: "Rotis", hotelName: "KC" },

    // --- PULAV VARIETIES ---
    { name: "Veg Pulav", description: "Fragrant basmati rice with mixed vegetables and whole spices.", price: 75, category: "Pulav", hotelName: "KC" },
    { name: "Paneer Pulav", description: "Basmati rice with paneer and aromatic spices.", price: 80, category: "Pulav", hotelName: "KC" },
    { name: "Gobi Pulav", description: "Basmati rice with cauliflower and spices.", price: 80, category: "Pulav", hotelName: "KC" },
    { name: "Cashewnut Pulav", description: "Fragrant pulav with roasted cashews.", price: 90, category: "Pulav", hotelName: "KC" },
    { name: "Mushroom Pulav", description: "Basmati rice with sautéed mushrooms and spices.", price: 90, category: "Pulav", hotelName: "KC" },
    { name: "Jeera Rice", description: "Steamed basmati rice tempered with cumin seeds.", price: 75, category: "Pulav", hotelName: "KC" },

    // --- SPL PAROTTA ---
    { name: "Chilly Parotta", description: "Flaky parotta tossed in chilli sauce.", price: 65, category: "Parotta", hotelName: "KC" },
    { name: "Veg Kothu Parotta", description: "Shredded parotta stir-fried with vegetables and spices.", price: 70, category: "Parotta", hotelName: "KC" },
    { name: "Paneer Kothu Parotta", description: "Shredded parotta with paneer and spices.", price: 95, category: "Parotta", hotelName: "KC" },
    { name: "Tawa Kothu Parotta", description: "Tawa-cooked kothu parotta with a special masala.", price: 75, category: "Parotta", hotelName: "KC" },

    // --- COMBOS ---
    { name: "Naan with PBM", description: "Naan paired with Paneer Butter Masala.", price: 140, category: "Combos", hotelName: "KC" },
    { name: "Naan with Paneer Chetinadu", description: "Naan served with Paneer Chettinad gravy.", price: 140, category: "Combos", hotelName: "KC" },
    { name: "Naan with Paneer Tikka Masala", description: "Naan with spicy Paneer Tikka Masala.", price: 160, category: "Combos", hotelName: "KC" },
    { name: "Naan with Veg Manchurian", description: "Naan with vegetable Manchurian.", price: 140, category: "Combos", hotelName: "KC" },
    { name: "Roti with PBM", description: "Roti served with Paneer Butter Masala.", price: 115, category: "Combos", hotelName: "KC" },
    { name: "Parotta with PBM (4 pcs)", description: "Four parottas served with Paneer Butter Masala.", price: 125, category: "Combos", hotelName: "KC" },
    { name: "Roti with Paneer Tikka Masala", description: "Roti paired with Paneer Tikka Masala.", price: 160, category: "Combos", hotelName: "KC" },
    { name: "Roti with Paneer Chetinadu", description: "Roti served with Paneer Chettinad gravy.", price: 140, category: "Combos", hotelName: "KC" },
    { name: "Roti with Alukofta", description: "Roti served with Alu Kofta gravy.", price: 160, category: "Combos", hotelName: "KC" },

    // --- CHINESE RICE ---
    { name: "Veg Fried Rice", description: "Stir-fried rice with mixed vegetables in soy sauce.", price: 65, category: "Chinese Rice", hotelName: "KC" },
    { name: "Gobi Fried Rice", description: "Fried rice with crispy cauliflower.", price: 75, category: "Chinese Rice", hotelName: "KC" },
    { name: "Paneer Fried Rice", description: "Fried rice with fresh paneer cubes.", price: 75, category: "Chinese Rice", hotelName: "KC" },
    { name: "Schezwan Fried Rice", description: "Spicy Schezwan sauce fried rice.", price: 80, category: "Chinese Rice", hotelName: "KC" },
    { name: "Schezwan Veg Fried Rice", description: "Vegetable fried rice in Schezwan sauce.", price: 75, category: "Chinese Rice", hotelName: "KC" },
    { name: "Schezwan Paneer Rice", description: "Paneer fried rice in Schezwan sauce.", price: 80, category: "Chinese Rice", hotelName: "KC" },
    { name: "Schezwan Mushroom Rice", description: "Mushroom fried rice in Schezwan sauce.", price: 80, category: "Chinese Rice", hotelName: "KC" },
    { name: "Casheynut Fried Rice", description: "Fried rice with roasted cashews.", price: 90, category: "Chinese Rice", hotelName: "KC" },
    { name: "Schezwan Cashewnut Fried Rice", description: "Cashew fried rice in spicy Schezwan sauce.", price: 90, category: "Chinese Rice", hotelName: "KC" },
    { name: "Babycorn Fried Rice", description: "Fried rice with baby corn.", price: 75, category: "Chinese Rice", hotelName: "KC" },
    { name: "Schezwan Babycorn Fried Rice", description: "Baby corn fried rice in Schezwan sauce.", price: 80, category: "Chinese Rice", hotelName: "KC" },
    { name: "Chilly Garlic Fried Rice", description: "Fried rice with chilli and garlic.", price: 80, category: "Chinese Rice", hotelName: "KC" },
    { name: "Capsicum Fried Rice", description: "Fried rice with fresh capsicum.", price: 75, category: "Chinese Rice", hotelName: "KC" },
    { name: "Ghee Dali Rice", description: "Steamed rice with ghee-tempered dali (lentils).", price: 65, category: "Chinese Rice", hotelName: "KC" },

    // --- STARTERS AND DRY ITEMS ---
    { name: "Dry Gobi", description: "Crispy fried cauliflower florets with spices.", price: 70, category: "Starters", hotelName: "KC" },
    { name: "Gobi 65", description: "Deep-fried spiced cauliflower in a tangy sauce.", price: 60, category: "Starters", hotelName: "KC" },
    { name: "Paneer 65", description: "Crispy fried paneer cubes in a spiced batter.", price: 78, category: "Starters", hotelName: "KC" },
    { name: "Babycorn 65", description: "Crispy baby corn tossed in spices.", price: 65, category: "Starters", hotelName: "KC" },
    { name: "Paneer Pepper Fry", description: "Paneer cubes tossed in cracked pepper and spices.", price: 85, category: "Starters", hotelName: "KC" },
    { name: "Mushroom Pepper Fry", description: "Mushrooms stir-fried with pepper and spices.", price: 80, category: "Starters", hotelName: "KC" },
    { name: "Mushroom 65", description: "Crispy fried mushrooms in a spiced batter.", price: 70, category: "Starters", hotelName: "KC" },
    { name: "Mushroom Dry", description: "Dry sautéed mushrooms with spices.", price: 80, category: "Starters", hotelName: "KC" },
    { name: "Veg Ball Manchurian Dry", description: "Crispy vegetable balls tossed in dry Manchurian sauce.", price: 100, category: "Starters", hotelName: "KC" },
    { name: "Paneer Bhurji", description: "Scrambled paneer with onions, tomatoes, and spices.", price: 85, category: "Starters", hotelName: "KC" },
    { name: "Babycorn Pepper Fry", description: "Baby corn tossed with cracked pepper and spices.", price: 90, category: "Starters", hotelName: "KC" },
    { name: "Babycorn Chilly Dry", description: "Dry chilli baby corn starter.", price: 80, category: "Starters", hotelName: "KC" },
    { name: "Paneer Chetinadu Dry", description: "Paneer in dry Chettinad spice mix.", price: 90, category: "Starters", hotelName: "KC" },
    { name: "Gobi Chetinadu Dry", description: "Cauliflower in dry Chettinad spices.", price: 90, category: "Starters", hotelName: "KC" },
    { name: "Mushroom Chetinadu Dry", description: "Mushrooms in dry Chettinad masala.", price: 90, category: "Starters", hotelName: "KC" },
    { name: "Chilly Paneer Dry", description: "Crispy paneer tossed in dry chilli sauce.", price: 90, category: "Starters", hotelName: "KC" },
    { name: "Paneer Tikka Dry", description: "Marinated paneer grilled to perfection.", price: 90, category: "Starters", hotelName: "KC" },
    { name: "Crispy Paneer", description: "Paneer coated and fried to a golden crisp.", price: 90, category: "Starters", hotelName: "KC" },
    { name: "Paneer Sticks", description: "Breaded and fried paneer sticks.", price: 90, category: "Starters", hotelName: "KC" },

    // --- SANDWICH ---
    { name: "Veg Cheese Sandwich", description: "Toasted sandwich with fresh vegetables and cheese.", price: 60, category: "Sandwich", hotelName: "KC" },
    { name: "Mushroom Sandwich", description: "Toasted sandwich filled with sautéed mushrooms.", price: 60, category: "Sandwich", hotelName: "KC" },
    { name: "Onion Cheese Sandwich", description: "Sandwich with caramelized onions and melted cheese.", price: 60, category: "Sandwich", hotelName: "KC" },
    { name: "Paneer Cheese Sandwich", description: "Sandwich with fresh paneer and melted cheese.", price: 60, category: "Sandwich", hotelName: "KC" },
    { name: "Chilli Cheese Sandwich", description: "Spicy chilli sandwich with melted cheese.", price: 70, category: "Sandwich", hotelName: "KC" },
    { name: "KC Spl Sandwich", description: "KC's special loaded sandwich.", price: 65, category: "Sandwich", hotelName: "KC" },
    { name: "Babycorn Sandwich", description: "Sandwich with baby corn filling.", price: 48, category: "Sandwich", hotelName: "KC" },
    { name: "Veg Plain Sandwich", description: "Simple plain vegetable sandwich.", price: 30, category: "Sandwich", hotelName: "KC" },
    { name: "Arabian Sandwich", description: "Arabian-style sandwich with unique flavors.", price: 80, category: "Sandwich", hotelName: "KC" },

    // --- PIZZA ---
    { name: "Veg Pizza", description: "Classic veggie pizza with tomato sauce and mozzarella.", price: 85, category: "Pizza", hotelName: "KC" },
    { name: "Paneer Pizza", description: "Pizza topped with marinated paneer.", price: 90, category: "Pizza", hotelName: "KC" },
    { name: "Mushroom Pizza", description: "Pizza topped with sautéed mushrooms.", price: 90, category: "Pizza", hotelName: "KC" },
    { name: "Chilly Cheese Pizza", description: "Spicy pizza with jalapeños and extra cheese.", price: 90, category: "Pizza", hotelName: "KC" },
    { name: "Onion Cheesepizza", description: "Pizza with caramelized onions and cheese.", price: 90, category: "Pizza", hotelName: "KC" },
    { name: "Babycorn Pizza", description: "Pizza loaded with baby corn and veggies.", price: 90, category: "Pizza", hotelName: "KC" },
    { name: "Paneer Tikka Pizza", description: "Pizza with marinated paneer tikka topping.", price: 110, category: "Pizza", hotelName: "KC" },

    // --- CHAT ---
    { name: "Channa Masala Chat", description: "Spiced chickpea chaat with chutneys.", price: 55, category: "Chat", hotelName: "KC" },
    { name: "Masala Poori", description: "Puffed poori with spiced potato masala.", price: 55, category: "Chat", hotelName: "KC" },
    { name: "Bhel Poori", description: "Puffed rice and vegetable chaat.", price: 40, category: "Chat", hotelName: "KC" },
    { name: "Sev Poori", description: "Crispy poori topped with sev and chutneys.", price: 55, category: "Chat", hotelName: "KC" },
    { name: "Papadi Chat", description: "Crispy papadi with yogurt, chutneys, and sev.", price: 55, category: "Chat", hotelName: "KC" },
    { name: "Pani Poori", description: "Hollow puri filled with spiced water and chutney.", price: 40, category: "Chat", hotelName: "KC" },
    { name: "Dahi Papadi", description: "Crispy papadi topped with sweet yogurt and chutneys.", price: 55, category: "Chat", hotelName: "KC" },
    { name: "Dahi Samosa", description: "Samosa drizzled with yogurt and chutneys.", price: 85, category: "Chat", hotelName: "KC" },
    { name: "Dahi Poori", description: "Poori topped with yogurt and chutneys.", price: 55, category: "Chat", hotelName: "KC" },
    { name: "Samosa Channa", description: "Crispy samosa served with spiced chickpeas.", price: 55, category: "Chat", hotelName: "KC" },
    { name: "Fried Alu Chat", description: "Fried potato chat with chutneys and spices.", price: 60, category: "Chat", hotelName: "KC" },
    { name: "Mixed Chat", description: "Mixed chaat platter with assorted items.", price: 60, category: "Chat", hotelName: "KC" },
    { name: "Bombay Chat", description: "Bombay-style chaat with sev and chutneys.", price: 60, category: "Chat", hotelName: "KC" },
    { name: "Pav Bhaji", description: "Mashed vegetable bhaji served with buttered pav.", price: 75, category: "Chat", hotelName: "KC" },
    { name: "Fried Pav Bhaji", description: "Pan-fried pav bhaji with extra butter.", price: 85, category: "Chat", hotelName: "KC" },
    { name: "Cheese Pav Bhaji", description: "Pav bhaji topped with melted cheese.", price: 85, category: "Chat", hotelName: "KC" },

    // --- MAGGIE & PASTA ---
    { name: "Veg Maggie", description: "Classic Maggi noodles cooked with veggies.", price: 40, category: "Maggie", hotelName: "KC" },
    { name: "Cheese Maggie", description: "Maggi noodles with melted cheese.", price: 60, category: "Maggie", hotelName: "KC" },
    { name: "Cheese Corn Maggie", description: "Maggi with cheese and sweet corn.", price: 60, category: "Maggie", hotelName: "KC" },
    { name: "Mac & Cheese Maggie", description: "Maggi in mac and cheese style.", price: 60, category: "Maggie", hotelName: "KC" },
    { name: "Schezwan Maggie", description: "Spicy Maggi in Schezwan sauce.", price: 60, category: "Maggie", hotelName: "KC" },
    { name: "Pink Bikin Maggie", description: "Pink tomato-based special Maggi.", price: 60, category: "Maggie", hotelName: "KC" },
    { name: "Mushroom Maggie", description: "Maggi with sautéed mushrooms.", price: 75, category: "Maggie", hotelName: "KC" },
    { name: "Cheese Pasta", description: "Creamy cheese pasta.", price: 60, category: "Maggie", hotelName: "KC" },
    { name: "Chilli Cheese Pasta", description: "Spicy pasta with chilli and cheese.", price: 75, category: "Maggie", hotelName: "KC" },
    { name: "Veg Pasta", description: "Mixed vegetable pasta in tomato sauce.", price: 75, category: "Maggie", hotelName: "KC" },
    { name: "Sweetcorn Pasta", description: "Pasta with sweet corn in cream sauce.", price: 75, category: "Maggie", hotelName: "KC" },
    { name: "Mushroom Pasta", description: "Pasta with mushrooms in cream sauce.", price: 75, category: "Maggie", hotelName: "KC" },

    // --- HOTDOG ---
    { name: "Paneer Hotdog", description: "Hotdog-style bread roll filled with spiced paneer.", price: 70, category: "Hotdog", hotelName: "KC" },
    { name: "Mushroom Hotdog", description: "Hotdog bread roll with sautéed mushrooms.", price: 70, category: "Hotdog", hotelName: "KC" },
    { name: "Babycorn Hotdog", description: "Hotdog bread with baby corn filling.", price: 65, category: "Hotdog", hotelName: "KC" },
    { name: "Veg Hotdog", description: "Classic veggie hotdog in a bread roll.", price: 70, category: "Hotdog", hotelName: "KC" },

    // --- JUICE ---
    { name: "Lemon Juice", description: "Fresh squeezed lemon juice, cool and refreshing.", price: 20, category: "Juice", hotelName: "KC" },
    { name: "Butter Milk", description: "Cool, spiced buttermilk drink.", price: 20, category: "Juice", hotelName: "KC" },
    { name: "Grape Juice", description: "Fresh grape juice, sweet and tangy.", price: 50, category: "Juice", hotelName: "KC" },
    { name: "Pineapple Juice", description: "Fresh pineapple juice.", price: 40, category: "Juice", hotelName: "KC" },
    { name: "Water Melon Juice", description: "Refreshing watermelon juice.", price: 30, category: "Juice", hotelName: "KC" },
    { name: "Badam Milk", description: "Chilled almond milk with a touch of saffron.", price: 35, category: "Juice", hotelName: "KC" },
    { name: "Rose Milk", description: "Sweet rose-flavored chilled milk.", price: 35, category: "Juice", hotelName: "KC" },
    { name: "Mousambi Juice", description: "Fresh sweet lime juice.", price: 55, category: "Juice", hotelName: "KC" },
    { name: "Apple Juice", description: "Fresh apple juice.", price: 60, category: "Juice", hotelName: "KC" },
    { name: "Fruit Mix Juice", description: "Mixed fruit juice blend.", price: 35, category: "Juice", hotelName: "KC" },
    { name: "Pomegranate Juice", description: "Fresh pomegranate juice.", price: 60, category: "Juice", hotelName: "KC" },
    { name: "Orange Juice", description: "Fresh orange juice.", price: 50, category: "Juice", hotelName: "KC" },
    { name: "Lassi", description: "Traditional chilled yogurt drink.", price: 45, category: "Juice", hotelName: "KC" },
    { name: "Sarbath", description: "Sweet chilled Indian summer drink.", price: 25, category: "Juice", hotelName: "KC" },
    { name: "Milk Sarbath", description: "Sweet milk sarbath.", price: 40, category: "Juice", hotelName: "KC" },
    { name: "Carrot Juice", description: "Fresh carrot juice.", price: 70, category: "Juice", hotelName: "KC" },
    { name: "Blueberry Milk", description: "Blueberry-flavored chilled milk.", price: 45, category: "Juice", hotelName: "KC" },
    { name: "Mango Milk", description: "Sweet mango milk.", price: 50, category: "Juice", hotelName: "KC" },
    { name: "Arabian Grape", description: "Arabian-style grape drink.", price: 50, category: "Juice", hotelName: "KC" },
    { name: "Arabian Litchi", description: "Litchi-based Arabian style drink.", price: 50, category: "Juice", hotelName: "KC" },
    { name: "Iced Tea", description: "Chilled brewed iced tea.", price: 40, category: "Juice", hotelName: "KC" },
    { name: "Sugarcane Juice", description: "Fresh pressed sugarcane juice.", price: 25, category: "Juice", hotelName: "KC" },
    { name: "Mango Juice", description: "Fresh mango juice.", price: 35, category: "Juice", hotelName: "KC" },
    { name: "Musk Melon", description: "Fresh musk melon juice.", price: 35, category: "Juice", hotelName: "KC" },
    { name: "Mint Ginger Lemon", description: "Refreshing mint, ginger, and lemon drink.", price: 30, category: "Juice", hotelName: "KC" },

    // --- MILKSHAKES ---
    { name: "Vanilla Milkshake", description: "Classic creamy vanilla milkshake.", price: 65, category: "Milkshakes", hotelName: "KC" },
    { name: "Strawberry Milkshake", description: "Fresh strawberry milkshake.", price: 65, category: "Milkshakes", hotelName: "KC" },
    { name: "Mango Milkshake", description: "Thick mango milkshake.", price: 70, category: "Milkshakes", hotelName: "KC" },
    { name: "Pineapple Milkshake", description: "Refreshing pineapple milkshake.", price: 65, category: "Milkshakes", hotelName: "KC" },
    { name: "Chocolate Milkshake", description: "Rich chocolate milkshake.", price: 70, category: "Milkshakes", hotelName: "KC" },
    { name: "Butterscotch Milkshake", description: "Creamy butterscotch milkshake.", price: 70, category: "Milkshakes", hotelName: "KC" },
    { name: "Pista Milkshake", description: "Pistachio-flavored milkshake.", price: 70, category: "Milkshakes", hotelName: "KC" },
    { name: "Blackcurrant Milkshake", description: "Blackcurrant milkshake.", price: 70, category: "Milkshakes", hotelName: "KC" },
    { name: "Sharjah Milkshake", description: "Banana-based Sharjah shake.", price: 90, category: "Milkshakes", hotelName: "KC" },
    { name: "Carrot Milkshake", description: "Fresh carrot milkshake.", price: 70, category: "Milkshakes", hotelName: "KC" },
    { name: "Apple Milkshake", description: "Apple milkshake.", price: 70, category: "Milkshakes", hotelName: "KC" },
    { name: "Dry Fruit Milkshake", description: "Rich milkshake with assorted dry fruits.", price: 90, category: "Milkshakes", hotelName: "KC" },
    { name: "Sizza Float", description: "Ice cream float with sizzling sauce.", price: 85, category: "Milkshakes", hotelName: "KC" },
    { name: "Strawberry Float", description: "Strawberry ice cream float.", price: 85, category: "Milkshakes", hotelName: "KC" },
    { name: "Mango Float", description: "Mango ice cream float.", price: 85, category: "Milkshakes", hotelName: "KC" },
    { name: "Pineapple Float", description: "Pineapple ice cream float.", price: 85, category: "Milkshakes", hotelName: "KC" },
    { name: "Chocolate Float", description: "Chocolate ice cream float.", price: 90, category: "Milkshakes", hotelName: "KC" },
    { name: "Butterscotch Float", description: "Butterscotch ice cream float.", price: 90, category: "Milkshakes", hotelName: "KC" },
    { name: "Pizza Float", description: "Fruit float with pizza-style topping.", price: 90, category: "Milkshakes", hotelName: "KC" },
    { name: "Cold Coffee", description: "Chilled coffee with ice cream.", price: 90, category: "Milkshakes", hotelName: "KC" },
    { name: "Cold Coffee With Icecream", description: "Cold coffee blended with ice cream.", price: 90, category: "Milkshakes", hotelName: "KC" },
    { name: "Blackcurrant Float", description: "Blackcurrant flavored float.", price: 90, category: "Milkshakes", hotelName: "KC" },
    { name: "Oreo Milk Shake", description: "Oreo cookie milkshake.", price: 80, category: "Milkshakes", hotelName: "KC" },
    { name: "Kitkat Milkshake", description: "KitKat chocolate milkshake.", price: 80, category: "Milkshakes", hotelName: "KC" },
    { name: "Redbeet Milkshake", description: "Healthy red beetroot milkshake.", price: 80, category: "Milkshakes", hotelName: "KC" },
    { name: "Fudge Banana Milkshake", description: "Banana milkshake with chocolate fudge.", price: 165, category: "Milkshakes", hotelName: "KC" },
    { name: "Sizzling Brownie", description: "Warm brownie served on a sizzler plate with ice cream.", price: 165, category: "Milkshakes", hotelName: "KC" },
    { name: "Banana Milkshake", description: "Classic banana milkshake.", price: 60, category: "Milkshakes", hotelName: "KC" },

    // --- ICECREAMS ---
    { name: "Two In One", description: "Two-flavor ice cream serving.", price: 75, category: "Icecreams", hotelName: "KC" },
    { name: "Three In One", description: "Three-flavor ice cream serving.", price: 100, category: "Icecreams", hotelName: "KC" },
    { name: "Nutcracker", description: "Nutcracker ice cream with nuts and sauce.", price: 125, category: "Icecreams", hotelName: "KC" },
    { name: "Cocktail Ice Cream", description: "Mixed cocktail-flavored ice cream.", price: 125, category: "Icecreams", hotelName: "KC" },
    { name: "Chocolate Praline", description: "Rich chocolate praline ice cream.", price: 125, category: "Icecreams", hotelName: "KC" },
    { name: "Falooda", description: "Rose-flavored dessert drink with vermicelli, basil seeds, and ice cream.", price: 125, category: "Icecreams", hotelName: "KC" },
    { name: "Fruit Salad With Icecreams", description: "Fresh fruit salad topped with scoops of ice cream.", price: 120, category: "Icecreams", hotelName: "KC" },

    { name: "Curd Vadai (2 PCS)", description: "Soft vadas soaked in fresh curd with chutney.", price: 50, category: "Vadai", hotelName: "KC" },
    { name: "Sambar Vadai (2 PCS)", description: "Vadas dunked in sambar.", price: 30, category: "Vadai", hotelName: "KC" },
    { name: "Mini Vadai (2 PCS)", description: "Mini vadai, crispy and golden.", price: 15, category: "Vadai", hotelName: "KC" },
    { name: "Mini Bonda (2 PCS)", description: "Mini bonda, fluffy and fried.", price: 15, category: "Vadai", hotelName: "KC" },
    { name: "Baji (2 PCS)", description: "Crispy bajji (fritters) served with chutney.", price: 15, category: "Vadai", hotelName: "KC" },
  ];

  // Attach realistic ratings and review counts
  const ratingsList = [4.9, 4.8, 4.7, 4.9, 4.6, 4.8, 4.5, 4.9, 4.7, 4.8, 4.6, 4.9, 4.8];
  const ratedKcItems = kcItems.map((item, idx) => ({
    ...item,
    rating: ratingsList[idx % ratingsList.length],
    reviewCount: 30 + ((idx * 13) % 180),
  }));

  // Insert all KC items
  await prisma.foodItem.createMany({ data: ratedKcItems });
  console.log(`Seeded ${ratedKcItems.length} KC Hotel menu items with ratings.`);

  // =============================================
  // SOUTHERN FOOD CANTEEN MENU
  // =============================================

  const southernItems = [
    // --- SOUTH INDIAN BREAKFAST ---
    { name: "Idly (2)", description: "Soft, fluffy steamed rice cakes served with sambar and chutneys.", price: 20, category: "South Indian", hotelName: "Southern Food" },
    { name: "Poori (2)", description: "Deep-fried fluffy wheat bread served with potato masala.", price: 40, category: "South Indian", hotelName: "Southern Food" },
    { name: "Pongal", description: "Creamy rice and lentil dish seasoned with cumin, pepper and ghee.", price: 40, category: "South Indian", hotelName: "Southern Food" },
    { name: "Rava Kitchadi", description: "Savory semolina upma with vegetables and spices.", price: 40, category: "South Indian", hotelName: "Southern Food" },

    // --- DOSA VARIETIES ---
    { name: "Dosa", description: "Classic thin, crispy fermented rice and lentil crepe.", price: 40, category: "Dosa", hotelName: "Southern Food" },
    { name: "Onion Dosa", description: "Crispy dosa topped with fresh chopped onions.", price: 55, category: "Dosa", hotelName: "Southern Food" },
    { name: "Podi Dosa", description: "Crispy dosa smeared with spicy gun powder (podi).", price: 55, category: "Dosa", hotelName: "Southern Food" },
    { name: "Veg Dosa", description: "Dosa filled with a mixed vegetable stuffing.", price: 55, category: "Dosa", hotelName: "Southern Food" },
    { name: "Bread Masal Dosa", description: "Dosa filled with bread masala stuffing.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Mushroom Masal Dosa", description: "Dosa filled with spiced mushroom masala.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Gobi Masal Dosa", description: "Dosa filled with spiced cauliflower masala.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Panner Masal Dosa", description: "Dosa stuffed with spiced paneer filling.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Mushroom Dosa", description: "Ghee-drizzled dosa filled with sautéed mushrooms.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Panner Dosa", description: "Ghee-drizzled dosa with paneer filling.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Channa Masal Dosa", description: "Ghee dosa with spiced chickpea masala.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Onion Dosa", description: "Dosa roasted in ghee with crispy onion topping.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Onion Podi Dosa", description: "Ghee dosa with onion and podi powder.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Veg Dosa", description: "Dosa with ghee and mixed vegetable filling.", price: 65, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Podi Dosa", description: "Crispy dosa with generous ghee and podi.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Onion Podi Dosa", description: "Dosa with onion and spicy podi topping.", price: 65, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Bread Masal Dosa", description: "Ghee dosa with bread masala filling.", price: 65, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Gobi", description: "Ghee-roasted dosa with spiced cauliflower.", price: 65, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Gobi Dosa", description: "Crispy ghee dosa stuffed with gobi masala.", price: 65, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Roast", description: "Thin, extra crispy dosa roasted in pure ghee.", price: 55, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Masala Dosa", description: "Golden ghee dosa with classic potato masala filling.", price: 60, category: "Dosa", hotelName: "Southern Food" },
    { name: "Papor Roast", description: "Papad roasted to a crisp, served as a side.", price: 55, category: "Dosa", hotelName: "Southern Food" },
    { name: "Cashewnuts Dosa", description: "Rich dosa topped with roasted cashew nuts.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Cashewnuts Dosa", description: "Ghee dosa with roasted cashew nut topping.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Onion Masal Dosa", description: "Masala dosa with extra onion topping.", price: 55, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Onion Rava Dosa", description: "Thin rava dosa with ghee and onion.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Rava Dosa", description: "Crispy thin semolina dosa.", price: 50, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Rava Dosa", description: "Crispy rava dosa drizzled with ghee.", price: 65, category: "Dosa", hotelName: "Southern Food" },
    { name: "Gobi Rava", description: "Rava dosa filled with spiced cauliflower.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Mush Rava", description: "Rava dosa filled with sautéed mushrooms.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Podi Rava", description: "Rava dosa with ghee and spicy podi.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Podi Rava", description: "Rava dosa topped with ghee and podi powder.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Gobi Rava", description: "Rava dosa with ghee and gobi filling.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Mush Rava Dosa", description: "Mushroom-filled rava dosa.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Mush Rava", description: "Ghee rava dosa with mushroom filling.", price: 75, category: "Dosa", hotelName: "Southern Food" },
    { name: "Panner Rava", description: "Rava dosa with paneer filling.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Panner Rava", description: "Ghee rava dosa with paneer.", price: 75, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Bread Masal Rava", description: "Rava dosa with ghee and bread masala.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Masist Masal Rava", description: "Special masala rava dosa.", price: 70, category: "Dosa", hotelName: "Southern Food" },
    { name: "Ghee Bread Masal Rava", description: "Ghee rava dosa stuffed with bread masala.", price: 75, category: "Dosa", hotelName: "Southern Food" },
    { name: "Chola Powi", description: "Fluffy puri served with spiced chola (chickpea) curry.", price: 55, category: "Dosa", hotelName: "Southern Food" },

    // --- CHINESE VARIETIES ---
    { name: "Chilli Parotta", description: "Flaky parotta tossed in spicy Indo-Chinese chilli sauce.", price: 60, category: "Chinese", hotelName: "Southern Food" },
    { name: "Kalma Parotta", description: "Shredded parotta stir-fried with masala.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Fried Rice", description: "Classic stir-fried rice with vegetables and soy sauce.", price: 65, category: "Chinese", hotelName: "Southern Food" },
    { name: "Gobi Fried Rice", description: "Fried rice with crispy cauliflower and soy sauce.", price: 65, category: "Chinese", hotelName: "Southern Food" },
    { name: "Paneer Fried Rice", description: "Fried rice with fresh paneer cubes.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Mushroom Fried Rice", description: "Stir-fried rice with sautéed mushrooms.", price: 65, category: "Chinese", hotelName: "Southern Food" },
    { name: "Mushroom Schezwan Rice", description: "Spicy Schezwan mushroom fried rice.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Paneer Schezwan Rice", description: "Paneer fried rice in bold Schezwan sauce.", price: 75, category: "Chinese", hotelName: "Southern Food" },
    { name: "Baby Corn Rice", description: "Stir-fried rice with tender baby corn.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Baby Corn Schezwan Rice", description: "Baby corn fried rice in spicy Schezwan sauce.", price: 75, category: "Chinese", hotelName: "Southern Food" },
    { name: "Schezwan Rice", description: "Spicy Schezwan sauce fried rice.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Gobi Schezwan Rice", description: "Cauliflower fried rice in Schezwan sauce.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Gobi Noodles", description: "Stir-fried noodles with crispy cauliflower.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Schezwan Gobi Noodles", description: "Cauliflower noodles in spicy Schezwan sauce.", price: 75, category: "Chinese", hotelName: "Southern Food" },
    { name: "Schezwan Paneer Noodles", description: "Paneer noodles in fiery Schezwan sauce.", price: 79, category: "Chinese", hotelName: "Southern Food" },
    { name: "Schezwan Noodles", description: "Classic Schezwan stir-fried noodles.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Baby Corn Noodles", description: "Stir-fried noodles with baby corn.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Mushroom Noodles", description: "Noodles stir-fried with mushrooms.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Paneer Noodles", description: "Stir-fried noodles with paneer cubes.", price: 70, category: "Chinese", hotelName: "Southern Food" },
    { name: "Schezwan Baby Corn Noodles", description: "Baby corn noodles in Schezwan sauce.", price: 75, category: "Chinese", hotelName: "Southern Food" },

    // --- MANCHURIAN VARIETIES ---
    { name: "Baby Corn Manchurian", description: "Crispy baby corn in savory Manchurian gravy.", price: 70, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Paneer Butter Masala", description: "Paneer in rich creamy tomato-butter sauce.", price: 80, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Chilly Gobi", description: "Crispy cauliflower tossed in spicy chilli sauce.", price: 70, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Gobi 65", description: "Deep-fried spiced cauliflower in tangy sauce.", price: 65, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Mushroom Manchurian", description: "Mushrooms in tangy Indo-Chinese Manchurian sauce.", price: 70, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Paneer Manchurian", description: "Paneer in savory Manchurian sauce.", price: 70, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Kadai Paneer", description: "Paneer cooked with bell peppers in robust kadai masala.", price: 70, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Mushroom 65", description: "Crispy fried mushrooms in spiced batter.", price: 60, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Paneer 65", description: "Crispy fried paneer in spiced batter.", price: 65, category: "Manchurian", hotelName: "Southern Food" },
    { name: "Baby Corn 65", description: "Crispy baby corn tossed in 65 spice blend.", price: 65, category: "Manchurian", hotelName: "Southern Food" },

    // --- LAPPA VARIETIES ---
    { name: "Lappa", description: "Soft wheat lappa served plain.", price: 40, category: "Lappa", hotelName: "Southern Food" },
    { name: "Onion Lappa", description: "Lappa filled with seasoned onions.", price: 60, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Lappa", description: "Lappa drizzled with pure ghee.", price: 60, category: "Lappa", hotelName: "Southern Food" },
    { name: "Veg Lappa", description: "Lappa stuffed with mixed vegetables.", price: 65, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Veg Lappa", description: "Ghee lappa with mixed vegetable filling.", price: 70, category: "Lappa", hotelName: "Southern Food" },
    { name: "Podi Lappa", description: "Lappa with spicy podi powder.", price: 60, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Podi Lappa", description: "Ghee lappa with podi powder.", price: 65, category: "Lappa", hotelName: "Southern Food" },
    { name: "Veg Podi Lappa", description: "Lappa with vegetables and podi.", price: 65, category: "Lappa", hotelName: "Southern Food" },
    { name: "Tomaio Lappa", description: "Lappa with spiced tomato filling.", price: 60, category: "Lappa", hotelName: "Southern Food" },
    { name: "Onion Masala Lappa", description: "Lappa with spiced onion masala.", price: 70, category: "Lappa", hotelName: "Southern Food" },
    { name: "Channa Masala Lappa", description: "Lappa filled with spiced chickpea masala.", price: 70, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Channa Masala Lappa", description: "Ghee lappa with channa masala.", price: 70, category: "Lappa", hotelName: "Southern Food" },
    { name: "Baby Corn Lappa", description: "Lappa stuffed with baby corn filling.", price: 60, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Masala Lappa", description: "Ghee lappa with spiced masala filling.", price: 70, category: "Lappa", hotelName: "Southern Food" },
    { name: "Bread Masala Lappa", description: "Lappa with bread masala stuffing.", price: 70, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Bread Masala Lappa", description: "Ghee lappa with bread masala.", price: 75, category: "Lappa", hotelName: "Southern Food" },
    { name: "Gobi Masal Lappa", description: "Lappa stuffed with gobi (cauliflower) masala.", price: 75, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Gobi Masal Lappa", description: "Ghee lappa with gobi masala.", price: 80, category: "Lappa", hotelName: "Southern Food" },
    { name: "Mushroom Lappa", description: "Lappa stuffed with sautéed mushrooms.", price: 75, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Mushroom Lappa", description: "Ghee lappa with mushroom filling.", price: 80, category: "Lappa", hotelName: "Southern Food" },
    { name: "Paneer Lappa", description: "Lappa filled with spiced paneer.", price: 75, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Paneer Lappa", description: "Ghee lappa with paneer filling.", price: 80, category: "Lappa", hotelName: "Southern Food" },
    { name: "Cashewnuts Lappa", description: "Lappa with roasted cashew nut filling.", price: 75, category: "Lappa", hotelName: "Southern Food" },
    { name: "Ghee Cashewnuts Lappa", description: "Ghee lappa with cashew nut filling.", price: 80, category: "Lappa", hotelName: "Southern Food" },
    { name: "Chilly Idly", description: "Soft idly tossed in a spicy chilli sauce.", price: 50, category: "Lappa", hotelName: "Southern Food" },
    { name: "Spicy Idly", description: "Idly seasoned with spicy masala.", price: 50, category: "Lappa", hotelName: "Southern Food" },

    // --- BRIYANI VARIETIES ---
    { name: "Veg Briyani", description: "Fragrant basmati rice with mixed vegetables and aromatic spices.", price: 50, category: "Briyani", hotelName: "Southern Food" },
    { name: "Hyderabad Briyani", description: "Authentic Hyderabadi-style dum biryani with rich spices.", price: 75, category: "Briyani", hotelName: "Southern Food" },
    { name: "Mushroom Briyani", description: "Aromatic biryani with mushrooms and whole spices.", price: 70, category: "Briyani", hotelName: "Southern Food" },
    { name: "Gobi Briyani", description: "Fragrant basmati rice cooked with cauliflower and spices.", price: 65, category: "Briyani", hotelName: "Southern Food" },

    // --- VARIETY RICE ---
    { name: "Bisibela Bath", description: "Karnataka-style warm lentil, rice and vegetable stew with ghee.", price: 40, category: "Variety Rice", hotelName: "Southern Food" },
    { name: "Curd Rice", description: "Cooling rice mixed with fresh yogurt, tempered with mustard and curry leaves.", price: 40, category: "Variety Rice", hotelName: "Southern Food" },
    { name: "Lemon Rice", description: "Tangy rice tempered with lemon juice, mustard, peanuts and turmeric.", price: 40, category: "Variety Rice", hotelName: "Southern Food" },
    { name: "Tamarind Rice", description: "Tangy tamarind-flavored rice with peanuts and spices.", price: 40, category: "Variety Rice", hotelName: "Southern Food" },
    { name: "Tomato Rice", description: "Rice cooked with fresh tomatoes and aromatic spices.", price: 40, category: "Variety Rice", hotelName: "Southern Food" },
    { name: "Meals", description: "Full South Indian meals plate with rice, sambar, rasam, kootu, poriyal, papad and pickle.", price: 80, category: "Variety Rice", hotelName: "Southern Food" },

    // --- SNACKS ---
    { name: "Vada (2)", description: "Crispy deep-fried lentil fritters, served with sambar and chutney.", price: 20, category: "Snacks", hotelName: "Southern Food" },
    { name: "Bonda (2)", description: "Soft fluffy fried bonda with potato filling.", price: 20, category: "Snacks", hotelName: "Southern Food" },
    { name: "Bajji (2)", description: "Crispy besan-battered vegetable bajji (fritters).", price: 20, category: "Snacks", hotelName: "Southern Food" },
    { name: "Bread Bajji (2)", description: "Bread slices dipped in spiced besan batter and deep-fried.", price: 25, category: "Snacks", hotelName: "Southern Food" },
    { name: "Onion Pakoda (2)", description: "Crispy onion fritters seasoned with spices.", price: 25, category: "Snacks", hotelName: "Southern Food" },
    { name: "Maggi Soup", description: "Warm and comforting Maggi masala noodle soup.", price: 35, category: "Snacks", hotelName: "Southern Food" },
    { name: "Tea", description: "Hot freshly brewed South Indian tea.", price: 12, category: "Snacks", hotelName: "Southern Food" },
    { name: "Coffee", description: "Hot South Indian filter coffee.", price: 15, category: "Snacks", hotelName: "Southern Food" },
  ];

  // Insert all Southern Food items
  await prisma.foodItem.createMany({ data: southernItems });
  console.log(`Seeded ${southernItems.length} Southern Food canteen menu items.`);

  // Keep a few generic campus items too
  await prisma.foodItem.createMany({
    data: [
      {
        name: "Artisan Chicken Pesto Sandwich",
        description: "Grilled chicken, fresh basil pesto, mozzarella, and heirloom tomatoes on toasted sourdough bread.",
        price: 249.00,
        discount: "50% OFF",
        category: "Sandwich",
        hotelName: "Campus Dining",
        imageUrl: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=500"
      },
      {
        name: "Premium Matcha Latte",
        description: "Stone-ground organic Japanese matcha whisked with steamed oat milk and a touch of honey.",
        price: 180.00,
        discount: "20% OFF",
        category: "Juice",
        hotelName: "Campus Dining",
        imageUrl: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500"
      },
      {
        name: "Truffle Parmesan Fries",
        description: "Hand-cut potatoes tossed in truffle oil, grated parmesan cheese, and fresh rosemary.",
        price: 150.00,
        discount: "BUY 1 GET 1",
        category: "Starters",
        hotelName: "Campus Dining",
        imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500"
      },
      {
        name: "Double Smash Cheeseburger",
        description: "Two prime beef patties, sharp cheddar, caramelized onions, and house sauce on a toasted brioche bun.",
        price: 299.00,
        discount: "HOT DEAL",
        category: "Starters",
        hotelName: "Campus Dining",
        imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500"
      }
    ]
  });

  // Create Community Groups
  const csClub = await prisma.communityGroup.create({
    data: {
      name: "Computer Science Association",
      description: "The home of student developers, designers, and tech enthusiasts. We host hackathons, tech talks, and social mixers.",
      membersCount: 342,
      imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500"
    }
  });

  const photoClub = await prisma.communityGroup.create({
    data: {
      name: "Campus Photo Collective",
      description: "A community for visual storytellers. Weekly photowalks, lighting workshops, and gallery showcases.",
      membersCount: 128,
      imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500"
    }
  });

  // Create Community Events
  await prisma.event.createMany({
    data: [
      {
        title: "Annual Fall Hackathon",
        description: "36 hours of coding, designing, and building. Team up with peers, win premium prizes, and network with sponsors.",
        date: "Friday, Nov 12 • 6:00 PM",
        membersCount: 180,
        groupId: csClub.id,
        imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500"
      },
      {
        title: "Street Photography Walk",
        description: "Explore the downtown district and capture golden hour street scenes. Open to all skill levels.",
        date: "Saturday, Oct 28 • 4:00 PM",
        membersCount: 24,
        groupId: photoClub.id,
        imageUrl: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500"
      }
    ]
  });

  // Create Marketplace Items
  await prisma.marketplaceItem.createMany({
    data: [
      {
        title: "iPad Pro 11\" (M1, 128GB) - Space Gray",
        description: "Like-new condition. Comes with Apple Pencil 2nd Gen, paper-like screen protector, and original boxes.",
        price: 45000.00,
        category: "Electronics",
        sellerName: "Sarah Jenkins",
        sellerPhone: "+918765432109",
        imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500"
      },
      {
        title: "Principles of Organic Chemistry (8th Ed)",
        description: "Hardcover textbook for CHEM 202. Very minor highlighting on a few pages.",
        price: 1500.00,
        category: "Textbooks",
        sellerName: "Alex Parker",
        sellerPhone: "+919876543210",
        imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500"
      }
    ]
  });

  // Create Freelance Projects
  await prisma.freelanceProject.createMany({
    data: [
      {
        title: "Portrait Photographer for Graduation",
        description: "Need a photographer for graduation portraits. Approx. 2 hours of shooting + editing.",
        budget: 5000.00,
        duration: "3 days",
        clientName: "Sarah Jenkins",
        clientPhone: "+918765432109"
      },
      {
        title: "Mobile App Wireframe & UI Design",
        description: "Looking for an interface designer to create Figma wireframes for a student group project. 5 screens total.",
        budget: 12000.00,
        duration: "1 week",
        clientName: "CS Startup Lab",
        clientPhone: "+916543210987"
      }
    ]
  });

  // Create Skill Posts
  await prisma.skillPost.createMany({
    data: [
      {
        title: "React Developer teaching Frontend Basics",
        description: "I can teach you React hooks, state management, and Tailwind CSS layouts.",
        skillOffered: "React / Next.js",
        skillWanted: "UI/UX Design in Figma",
        userName: "Alex Parker",
        userPhone: "+919876543210"
      },
      {
        title: "Native French speaker wanting Guitar lessons",
        description: "Offering conversational French sessions in exchange for beginner acoustic guitar lessons.",
        skillOffered: "French Conversation",
        skillWanted: "Acoustic Guitar",
        userName: "Sarah Jenkins",
        userPhone: "+918765432109"
      }
    ]
  });

  console.log('Database seeded successfully with KC Hotel menu and Indian mock data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
