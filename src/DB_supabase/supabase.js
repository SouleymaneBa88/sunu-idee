import { createClient } from "@supabase/supabase-js"
import { genericCategorie } from "../IAGENERE/ia.js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseClient = createClient(
    supabaseUrl,
    supabaseKey
)

// Ajouter une idee
export async function addIdee(data) {
    try {
        const categorieOllama = await genericCategorie(
            data.titre,
            data.description
        );

        const { data: insertedData, error } = await supabaseClient
            .from("messages")
            .insert([
                {
                    categorie: categorieOllama,
                    titre: data.titre,
                    description: data.description
                }
            ])
            .select();

        if (error) {
            throw error;
        }

        return insertedData;

    } catch (error) {
        console.error("Erreur addIdee:", error);
        return null;
    }
}

// Charger messages
export async function loadMessages() {
    const { data, error } = await supabaseClient
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return [];
    }

    return data;
}

// Update
export async function update(id, titre, categorie, description) {
    const { data, error } = await supabaseClient
        .from("messages")
        .update({
            titre,
            categorie,
            description
        })
        .eq("id", id)
        .select();

    if (error) {
        console.error("Erreur update", error);
        return null;
    }

    return data;
}

// Delete
export async function confirmDelete(id) {
    if (!id) {
        console.error("delete annulé: id manquant");
        return;
    }

    const { error } = await supabaseClient
        .from("messages")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        return;
    }

    document.getElementById("dialog").close();
}

// Filtre catégorie
export async function getMessagesByCategorie(categorie) {
    try {
        let query = supabaseClient
            .from("messages")
            .select("*")
            .order("created_at", { ascending: false });

        if (categorie && categorie !== "tout") {
            query = query.eq("categorie", categorie);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data;

    } catch (error) {
        console.error("Erreur Supabase filtre :", error);
        return [];
    }
}