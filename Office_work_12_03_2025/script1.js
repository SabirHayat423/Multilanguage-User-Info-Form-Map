document.getElementById("hubspotForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const firstname = e.target.firstname.value;
    const email = e.target.email.value;
    const age = e.target.age.value;
   
    const data = {
        fields: [
            { name: "firstname", value: firstname },
            { name: "email", value: email },
            { name: "age", value: age }
        ]
    };

    const url = "https://api.hsforms.com/submissions/v3/integration/submit/244535012/b180fbb2-254a-42ef-8031-131c94daf195";

    const responseEl = document.getElementById("response");

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            responseEl.innerText = "Form submitted successfully!";
            responseEl.style.color = "green";
            responseEl.style.display = "block";
            e.target.reset(); 
        } else {
            const errorText = await res.text();
            console.log("HubSpot error:", errorText);
            responseEl.innerText = "Error submitting form.";
            responseEl.style.color = "red";
            responseEl.style.display = "block";
        }
    } catch (err) {
        console.log(err);
        responseEl.innerText = "Network error. Please try again.";
        responseEl.style.color = "red";
        responseEl.style.display = "block";
    }
     setTimeout(() => responseEl.style.display = "none", 2000);
});
