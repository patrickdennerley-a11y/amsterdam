/**
 * UniMelb Match - Database Seeder
 *
 * Generates test user profiles with Voyage AI embeddings.
 *
 * Usage:
 *   npx ts-node scripts/seed.ts
 *
 * Required env vars:
 *   - NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - VOYAGE_API_KEY
 */

import { createClient } from "@supabase/supabase-js";

// ----------------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------------

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !VOYAGE_API_KEY) {
  console.error("Missing required environment variables");
  console.error(
    "Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VOYAGE_API_KEY"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Voyage AI configuration
const VOYAGE_MODEL = "voyage-3-lite";
const VOYAGE_DIMENSIONS = 512;

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface TestUser {
  email: string;
  password: string;
  full_name: string;
  major: string;
  bio: string;
}

interface VoyageEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    total_tokens: number;
  };
}

// ----------------------------------------------------------------------------
// Test User Archetypes
// ----------------------------------------------------------------------------

const TEST_USERS: TestUser[] = [
  // The CS Grinders (will match well with each other)
  {
    email: "alice.chen@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Alice Chen",
    major: "Computer Science",
    bio: "Third year CS student obsessed with competitive programming. Currently grinding LeetCode for internship season. I spend way too much time playing League of Legends and attending hackathons. Looking for study buddies who understand the pain of debugging at 3am.",
  },
  {
    email: "bob.kumar@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Bob Kumar",
    major: "Software Engineering",
    bio: "Software engineering student and hackathon enthusiast. I love building random side projects that I never finish. Currently learning Rust and contributing to open source. Big fan of esports - mainly watch Valorant and League. Always down for coding sessions.",
  },

  // The Arts Students (will match well with each other)
  {
    email: "emma.wilson@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Emma Wilson",
    major: "Philosophy",
    bio: "Philosophy major questioning everything, including why I chose philosophy. You can find me at Brunswick cafes pretending to read Nietzsche while actually scrolling through TikTok. Love art galleries, indie films, and deep conversations about literally nothing.",
  },
  {
    email: "finn.oshea@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Finn O'Shea",
    major: "History and Politics",
    bio: "History nerd with too many opinions about obscure historical events. I spend my weekends exploring Melbourne's hidden bookshops and arguing about politics. Love film photography, vinyl records, and finding the best coffee in Brunswick.",
  },

  // The Commerce Bros (will match well with each other)
  {
    email: "james.wong@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "James Wong",
    major: "Commerce (Finance)",
    bio: "Finance major on the grind for consulting internships. Currently preparing for CFA Level 1. When I'm not in the library, I'm at the gym or watching market analysis videos. Looking for networking opportunities and gym buddies.",
  },
  {
    email: "sarah.anderson@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Sarah Anderson",
    major: "Commerce (Accounting)",
    bio: "Accounting student with dreams of Big 4 and beyond. Love gym, brunch, and analyzing company financials for fun (yes, really). Part of the UniMelb Finance Club. Always happy to chat about career stuff or grab coffee.",
  },

  // The International Students (will match well with each other)
  {
    email: "ming.liu@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Ming Liu",
    major: "Data Science",
    bio: "International student from Beijing exploring everything Melbourne has to offer! Love trying new restaurants, weekend road trips, and learning about Australian culture. Also into photography and always looking for people to explore the city with.",
  },
  {
    email: "priya.sharma@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Priya Sharma",
    major: "Information Systems",
    bio: "First year international student from Mumbai. Still getting used to Melbourne weather! Love Bollywood, cooking Indian food (happy to share), and exploring new places. Looking for friends to discover Melbourne's hidden gems together.",
  },

  // The BioMed Stressheads (will match well with each other)
  {
    email: "tom.nguyen@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Tom Nguyen",
    major: "Biomedical Science",
    bio: "Pre-med student slowly losing my mind preparing for GAMSAT. If I'm not in the Baillieu Library, something has gone terribly wrong. Stress-baking is my coping mechanism. Looking for study partners and people to share my GAMSAT misery with.",
  },
  {
    email: "lisa.patel@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Lisa Patel",
    major: "Medicine",
    bio: "First year med student surviving on coffee and determination. Passionate about public health and mental health awareness. When I'm not studying (rare), I enjoy yoga, true crime podcasts, and trying to maintain some work-life balance.",
  },

  // Cross-interest users (to test diverse matching)
  {
    email: "alex.martinez@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Alex Martinez",
    major: "Mechatronics Engineering",
    bio: "Engineering student who also plays in a band on weekends. Weird combo, I know. Love building robots and playing guitar. Big into hiking and camping around Victoria. Looking for creative people who like both tech and arts.",
  },
  {
    email: "zoe.taylor@student.unimelb.edu.au",
    password: "TestPass123!",
    full_name: "Zoe Taylor",
    major: "Psychology",
    bio: "Psych major interested in the science of human connection (ironic that I'm on a matching app). Love board games, escape rooms, and amateur astronomy. Part of the UniMelb Hiking Club. Looking for curious minds and adventure buddies.",
  },
];

// ----------------------------------------------------------------------------
// Voyage AI Client
// ----------------------------------------------------------------------------

async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: "document",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage AI error: ${response.status} - ${error}`);
  }

  const data: VoyageEmbeddingResponse = await response.json();

  return data.data
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

// ----------------------------------------------------------------------------
// Seeding Functions
// ----------------------------------------------------------------------------

async function createTestUser(user: TestUser): Promise<string | null> {
  console.log(`Creating user: ${user.email}`);

  // Create auth user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm for testing
    });

  if (authError) {
    // If user exists, try to fetch them
    if (authError.message.includes("already been registered")) {
      console.log(`  User already exists, fetching...`);
      const { data: existingUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", user.email)
        .single();

      return existingUsers?.id || null;
    }
    console.error(`  Auth error: ${authError.message}`);
    return null;
  }

  console.log(`  Created auth user: ${authData.user.id}`);
  return authData.user.id;
}

async function updateUserProfile(
  userId: string,
  user: TestUser,
  embedding: number[]
): Promise<boolean> {
  console.log(`  Updating profile for ${user.full_name}...`);

  // Format embedding for pgvector (as string array)
  const embeddingString = `[${embedding.join(",")}]`;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: user.full_name,
      major: user.major,
      bio: user.bio,
      embedding: embeddingString,
      status: "waiting",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error(`  Profile update error: ${error.message}`);
    return false;
  }

  console.log(`  Profile updated successfully`);
  return true;
}

async function seed() {
  console.log("=".repeat(60));
  console.log("UniMelb Match Database Seeder");
  console.log("=".repeat(60));
  console.log(`Model: ${VOYAGE_MODEL}`);
  console.log(`Dimensions: ${VOYAGE_DIMENSIONS}`);
  console.log(`Users to create: ${TEST_USERS.length}`);
  console.log("=".repeat(60));
  console.log("");

  // Generate all embeddings in batch (more efficient)
  console.log("Generating embeddings with Voyage AI...");
  const bioTexts = TEST_USERS.map(
    (u) => `Name: ${u.full_name}. Major: ${u.major}. Bio: ${u.bio}`
  );

  let embeddings: number[][];
  try {
    embeddings = await generateEmbeddingsBatch(bioTexts);
    console.log(`Generated ${embeddings.length} embeddings`);
  } catch (error) {
    console.error("Failed to generate embeddings:", error);
    process.exit(1);
  }

  console.log("");

  // Create users and update profiles
  let successCount = 0;

  for (let i = 0; i < TEST_USERS.length; i++) {
    const user = TEST_USERS[i];
    const embedding = embeddings[i];

    const userId = await createTestUser(user);

    if (userId) {
      // Small delay to ensure trigger has created profile
      await new Promise((resolve) => setTimeout(resolve, 500));

      const updated = await updateUserProfile(userId, user, embedding);
      if (updated) {
        successCount++;
      }
    }

    console.log("");
  }

  console.log("=".repeat(60));
  console.log(`Seeding complete: ${successCount}/${TEST_USERS.length} users created`);
  console.log("=".repeat(60));

  // Display similarity preview
  console.log("");
  console.log("Testing similarity search...");

  const { data: waitingUsers, error: queryError } = await supabase
    .from("profiles")
    .select("full_name, major")
    .eq("status", "waiting")
    .not("embedding", "is", null);

  if (queryError) {
    console.error("Query error:", queryError.message);
  } else {
    console.log(`Users in waiting pool: ${waitingUsers?.length || 0}`);
    waitingUsers?.forEach((u) => {
      console.log(`  - ${u.full_name} (${u.major})`);
    });
  }
}

// Run seeder
seed().catch(console.error);
