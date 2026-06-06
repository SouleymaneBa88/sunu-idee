import {
    addIdee,
    loadMessages,
    confirmDelete as deleteIdea,
    update,
    supabaseClient,
    getMessagesByCategorie
} from './DB_supabase/supabase.js';

import {
    validationDescription,
    validationTitre
} from "./validationForm/validation.js";


//  RECUP FORM
function getForm(form) {
    const formData = new FormData(form);
    return {
        titre: formData.get("titre"),
        description: formData.get("description")
    };
}


//  AFFICHER CARTES
async function afficherCartes(message = null) {
    if (!message) {
        message = await loadMessages();
    }

    const cards = document.getElementById("card");
    const total = document.getElementById("Total_idee");

    if (!message || message.length === 0) {
        cards.innerHTML = "<p class='text-gray-400'>Aucune idée trouvée  ?</p>";
        total.textContent = 0;
        return;
    }

    cards.innerHTML = message.map((idee) => `
        <div class="bg-[#111a2e] border border-[#26324a] p-4 rounded-xl">

            <span class="text-orange-400 text-xs">
                ${idee.categorie?.toUpperCase()}
            </span>

            <h3 class="font-bold mt-2">
                ${idee.titre}
            </h3>

            <p class="text-gray-400 text-sm mt-1">
                ${idee.description}
            </p>

            <p class="text-gray-400 text-sm mt-1">
                ${idee.created_at ? new Date(idee.created_at).toLocaleDateString() : ""}
            </p>

            <button class="rounded-md px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
                onclick="editIdee('${idee.id}')">
                <i class="fa-solid fa-pen text-green"></i>
            </button>

            <button class="rounded-md px-2.5 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
                onclick="openDeleteModal('${idee.id}')">
                <i class="fa-solid fa-trash text-red-500"></i>
            </button>

        </div>
    `).join("");

    total.textContent = message.length;
}


//  INIT
afficherCartes();


//  FILTRE CATEGORIE
function filtreCategorie() {
    const boutons = document.querySelectorAll(".btn-filtre");

    boutons.forEach((btn) => {
        btn.addEventListener("click", async () => {

            const categorie = btn.dataset.categorie;

            boutons.forEach((b) => {
                b.classList.remove("bg-green", "text-black", "font-bold");
                b.classList.add("bg-[#111a2e]", "border", "border-[#26324a]");
            });

            btn.classList.add("bg-green", "text-black", "font-bold");
            btn.classList.remove("bg-[#111a2e]", "border", "border-[#26324a]");

            const data = await getMessagesByCategorie(categorie);
            afficherCartes(data);
        });
    });
}

filtreCategorie();


//  AJOUT IDEE
const btn = document.getElementById("btn");

document.getElementById("form")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const titreOk = validationTitre();
    const descriptionOk = validationDescription();

    if (!titreOk || !descriptionOk) {
        btn.textContent = "Corrige les erreurs";
        btn.classList.add("bg-red-500");
        return;
    }

    const form = e.target;
    const data = getForm(form);

    btn.disabled = true;
    btn.textContent = "Analyse IA...";
    btn.classList.add("bg-gray-500", "cursor-not-allowed");

    try {
        await addIdee(data);
        await afficherCartes();
        form.reset();
    } catch (error) {
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.textContent = "Ajouter une idee";
        btn.classList.remove("bg-gray-500", "cursor-not-allowed", "bg-red-500");
        btn.classList.add("bg-green");
    }
});


//  DELETE MODAL
let deleteId = null;

function openDeleteModal(id) {
    if (!id) return;

    deleteId = id;
    document.getElementById("dialog").showModal();
}

window.openDeleteModal = openDeleteModal;

window.confirmDelete = async () => {
    await deleteIdea(deleteId);
    await afficherCartes();
};


//  EDIT
async function editIdee(id) {
    const message = await loadMessages();

    const idee = message.find(
        item => String(item.id) === String(id)
    );

    if (!idee) return;

    document.getElementById("editId").value = idee.id;
    document.getElementById("editTitre").value = idee.titre;
    document.getElementById("editCategorie").value = idee.categorie;
    document.getElementById("editDescription").value = idee.description;

    document.getElementById("editDialog").showModal();
}

window.editIdee = editIdee;


// fermer modal edit
function closeEditModal() {
    document.getElementById("editDialog").close();
}

window.closeEditModal = closeEditModal;


//  SAVE UPDATE
document.getElementById("editForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const id = document.getElementById("editId").value;
    const titre = document.getElementById("editTitre").value;
    const categorie = document.getElementById("editCategorie").value;
    const description = document.getElementById("editDescription").value;

    await update(id, titre, categorie, description);
    await afficherCartes();
    closeEditModal();
});

function initRealtime() {

    supabaseClient
        .channel('messages-channel')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'messages'
            },
            async (payload) => {
                console.log(" Changement détecté :", payload);

                // refresh automatique UI
                const data = await loadMessages();
                afficherCartes(data);
            }
        )
        .subscribe();
}

initRealtime();