import { storage } from "./storage";

const mockLawyers = [
  {
    name: "Sarah Jenkins",
    firm: "Jenkins & Associates",
    practiceAreas: ["Corporate", "Startups", "Entity Formation"],
    states: ["CA", "NY"],
    languages: ["English", "Spanish"],
    hourlyRate: 350,
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 49, // 4.9 * 10
    description: "Specializing in tech startups and efficient entity formation."
  },
  {
    name: "David Chen",
    firm: "Chen Legal Group",
    practiceAreas: ["Personal Injury", "Liability"],
    states: ["CA", "TX"],
    languages: ["English", "Mandarin"],
    hourlyRate: 300,
    imageUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 48,
    description: "Tenacious representation for personal injury victims."
  },
  {
    name: "Elena Rodriguez",
    firm: "Rodriguez Law",
    practiceAreas: ["Family Law", "Estate Planning"],
    states: ["FL", "NY"],
    languages: ["English", "Spanish", "Portuguese"],
    hourlyRate: 275,
    imageUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 47,
    description: "Compassionate counsel for family matters."
  },
  {
    name: "Michael Ross",
    firm: "Pearson Specter",
    practiceAreas: ["Corporate", "Litigation"],
    states: ["NY"],
    languages: ["English"],
    hourlyRate: 500,
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 50,
    description: "Top-tier corporate litigation and strategy."
  },
  {
    name: "Amanda Smith",
    firm: "Smith & Partners",
    practiceAreas: ["Personal Injury", "Medical Malpractice"],
    states: ["CA", "WA"],
    languages: ["English"],
    hourlyRate: 325,
    imageUrl: "https://images.unsplash.com/photo-1598550874175-4d7112ee751c?auto=format&fit=crop&q=80&w=200&h=200",
    rating: 46,
    description: "Dedicated to getting you the compensation you deserve."
  }
];

async function seed() {
  console.log("Seeding database...");
  
  try {
    const existing = await storage.getAllLawyers();
    
    if (existing.length > 0) {
      console.log(`Database already has ${existing.length} lawyers. Skipping seed.`);
      return;
    }

    for (const lawyer of mockLawyers) {
      await storage.createLawyer(lawyer);
    }

    console.log(`Successfully seeded ${mockLawyers.length} lawyers.`);
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed();
