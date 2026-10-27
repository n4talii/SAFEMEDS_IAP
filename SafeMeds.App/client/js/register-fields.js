(() => {
  const roleInput = document.getElementById("account-role");
  const ownerFields = document.getElementById("owner-fields");
  const pharmacyInput = document.getElementById("pharmacy-name");
  const jobTitleInput = document.getElementById("job-title");
  const pharmacyOptions = document.getElementById("pharmacy-options");
  if (!roleInput || !ownerFields || !pharmacyInput || !jobTitleInput) return;

  const pharmacyDirectoryUrl = "http://localhost:8080/api/pharmacies/directory";
  const projectPharmacies = [
    { pharmacy_name: "Portal Pharmacy", branch: "Banda Street", actual_address: "Portal Place Building, Banda Street, Nairobi CBD" },
    { pharmacy_name: "Portal Pharmacy", branch: "Two Rivers", actual_address: "Ground Floor, Two Rivers Mall, Two Rivers Road, Nairobi" },
    { pharmacy_name: "Goodlife Pharmacy", branch: "City Square", actual_address: "Harambee Avenue, Nairobi CBD" },
    { pharmacy_name: "Goodlife Pharmacy", branch: "Shell Madaraka", actual_address: "Shell Service Station, Langata Road, Madaraka, Nairobi" },
    { pharmacy_name: "Harojan Pharmacy", branch: "Siwaka Plaza, Strathmore", actual_address: "Siwaka Plaza, near Strathmore University, Madaraka, Nairobi" },
    { pharmacy_name: "Strathmore University Medical Centre Pharmacy", branch: "Madaraka Campus", actual_address: "Strathmore University, Ole Sangale Road, Madaraka, Nairobi" },
    { pharmacy_name: "Easton Pharmacy", branch: "Uchumi House", actual_address: "Uchumi House, Agakhan Walk, Nairobi CBD" },
    { pharmacy_name: "Malibu Pharmacy", branch: "Agriculture House, Moi Avenue", actual_address: "Agriculture House, Moi Avenue, Nairobi CBD" },
    { pharmacy_name: "Malibu Pharmacy", branch: "The Oval, Parklands", actual_address: "The Oval, Ring Road Parklands, Nairobi" },
    { pharmacy_name: "Health Aid Chemist", branch: "Aly’s Center, Parklands", actual_address: "Muthithi Road and Mpaka Road junction, Nairobi" },
    { pharmacy_name: "Dan Pharmacy Ltd", branch: "Kangemi", actual_address: "Waiyaki Way, next to Total petrol station, Kangemi Market, Nairobi" },
    { pharmacy_name: "Belladonna Pharmacy Ltd", branch: "Village Market", actual_address: "Limuru Road, Village Market, Nairobi" },
  ];
  const normalize = (value) => String(value || "").trim().toLocaleLowerCase();
  let pharmacies = [...projectPharmacies];
  let lastPharmacyName = normalize(pharmacyInput.value);

  function renderOptions(list, values) {
    if (!list) return;
    list.replaceChildren(...[...new Set(values.filter(Boolean))].map((value) => {
      const option = document.createElement("option");
      option.value = value;
      return option;
    }));
  }

  function updateBranches() {
    const selectedName = normalize(pharmacyInput.value);
    if (selectedName !== lastPharmacyName) {
      document.getElementById("branch").value = "";
      document.getElementById("pharmacy-address").value = "";
      renderOptions(document.getElementById("branch-options"), []);
      lastPharmacyName = selectedName;
    }
    const records = pharmacies.filter((row) => normalize(row.pharmacy_name) === selectedName);
    const branchInput = document.getElementById("branch");
    const addressInput = document.getElementById("pharmacy-address");
    renderOptions(document.getElementById("branch-options"), records.map((row) => row.branch));
    if (!records.length) return;
    const selectedBranch = normalize(branchInput.value);
    const matchingBranch = records.find((row) => normalize(row.branch) === selectedBranch);
    if (matchingBranch) {
      if (matchingBranch.actual_address) addressInput.value = matchingBranch.actual_address;
      return;
    }
    if (records.length === 1) {
      branchInput.value = records[0].branch;
      addressInput.value = records[0].actual_address;
    } else {
      branchInput.value = "";
      addressInput.value = "";
    }
  }

  function updateAddress() {
    const pharmacyName = normalize(pharmacyInput.value);
    const branchName = normalize(document.getElementById("branch").value);
    const record = pharmacies.find((row) =>
      normalize(row.pharmacy_name) === pharmacyName && normalize(row.branch) === branchName,
    );
    if (record?.actual_address) document.getElementById("pharmacy-address").value = record.actual_address;
  }

  function updateOwnerFields() {
    const isOwner = roleInput.value === "owner";
    ownerFields.hidden = !isOwner;
    pharmacyInput.required = isOwner;
    jobTitleInput.required = isOwner;
  }

  async function loadPharmacies() {
    try {
      const response = await fetch(pharmacyDirectoryUrl, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Directory request failed (${response.status})`);
      const result = await response.json();
      const remotePharmacies = (result.pharmacies || [])
        .filter((row) => row && typeof row.pharmacy_name === "string");
      const merged = new Map();
      [...projectPharmacies, ...remotePharmacies].forEach((row) => {
        const key = `${normalize(row.pharmacy_name)}|${normalize(row.branch)}`;
        merged.set(key, { ...merged.get(key), ...row });
      });
      pharmacies = [...merged.values()];
    } catch (error) {
      console.info("Using the SafeMeds class pharmacy list while the directory is unavailable.", error);
    }
    const names = [...new Set(pharmacies.map((row) => row.pharmacy_name).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    renderOptions(pharmacyOptions, names);
    updateBranches();
  }

  roleInput.addEventListener("change", updateOwnerFields);
  pharmacyInput.addEventListener("input", updateBranches);
  pharmacyInput.addEventListener("change", updateBranches);
  document.getElementById("branch")?.addEventListener("input", updateAddress);
  document.getElementById("branch")?.addEventListener("change", updateAddress);
  updateOwnerFields();
  void loadPharmacies();
})();
