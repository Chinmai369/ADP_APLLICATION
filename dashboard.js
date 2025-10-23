
    const CREDENTIALS = { 
      admin: { username: 'admin', password: 'admin123', role: 'admin' },
      commissioner: { username: 'commissioner', password: 'comm123', role: 'commissioner' }
    };
    const fmtINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n).replace('INR', '₹');

    const loginPanel = document.getElementById('loginPanel');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const userBadge = document.getElementById('userBadge');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const commissionerDashboard = document.getElementById('commissionerDashboard');
    const previewModal = document.getElementById('previewModal');
    const closePreviewBtn = document.getElementById('closePreviewBtn');
    const previewContent = document.getElementById('previewContent');
    const commissionerRemarks = document.getElementById('commissionerRemarks');
    const saveRemarksBtn = document.getElementById('saveRemarksBtn');
    const approveBtn = document.getElementById('approveBtn');
  // Preview file inputs removed; commissioner must rely on files attached to the forwarded submission
    const commissionerTableBody = document.getElementById('commissionerTableBody');
  const postApprovePanel = document.getElementById('postApprovePanel');
  const deptSelect = document.getElementById('deptSelect');
  const sectionSelect = document.getElementById('sectionSelect');
  const forwardToDeptBtn = document.getElementById('forwardToDeptBtn');
  const forwardRemarks = document.getElementById('forwardRemarks');
  const forwardSuccess = document.getElementById('forwardSuccess');
  let currentApprovedId = null;

    const dashboard = document.getElementById('dashboard');
    const year = document.getElementById('year');
    const installment = document.getElementById('installment');
    const grantType = document.getElementById('grantType');
    const program = document.getElementById('program');

    const selectionChips = document.getElementById('selectionChips');
    const summaryPanel = document.getElementById('summaryPanel');
    const summaryChips = document.getElementById('summaryChips');
    const budgetAmt = document.getElementById('budgetAmt');
    const remainingAmt = document.getElementById('remainingAmt');

    const radpFormPanel = document.getElementById('radpFormPanel');
    const workType = document.getElementById('workType');
    const locationField = document.getElementById('location');
    const latlong = document.getElementById('latlong');
    const image = document.getElementById('image');
    const proposalName = document.getElementById('proposalName');
    const estimatedCost = document.getElementById('estimatedCost');
    const prioritization = document.getElementById('prioritization');
    const crStatusCR = document.getElementById('crStatusCR');
    const crStatusIA = document.getElementById('crStatusIA');
    const crNumber = document.getElementById('crNumber');
    const crDate = document.getElementById('crDate');
    const crCopy = document.getElementById('crCopy');
    const numberOfWorks = document.getElementById('numberOfWorks');
    const numberOfWorksField = document.getElementById('numberOfWorksField');
    const submitBtn = document.getElementById('submitBtn');
    const formError = document.getElementById('formError');
    const successMsg = document.getElementById('successMsg');
    const postSubmitPanel = document.getElementById('postSubmitPanel');
    const submissionTableBody = document.getElementById('submissionTableBody');
    const forwardCommissionerBtn = document.getElementById('forwardCommissionerBtn');
    const committeeSignature = document.getElementById('committeeSignature');
    const councilResolutionSignature = document.getElementById('councilResolutionSignature');
    const submissions = [];
    const forwardedSubmissions = []; // Store submissions forwarded to commissioner
    let currentUser = null;


    let selection = { year: '', installment: '', grantType: '', program: '' };

    function show(el){ el.classList.remove('hidden'); }
    function hide(el){ el.classList.add('hidden'); }

    function updateChips(container, items){
      container.innerHTML = '';
      Object.entries(items).forEach(([_, val]) => {
        if(!val) return;
        const chip = document.createElement('div');
        chip.className = 'chip';
        chip.textContent = val;
        container.appendChild(chip);
      });
    }

    function refreshUI(){
      updateChips(selectionChips, selection);
      updateChips(summaryChips, selection);
      const totalBudget = 1000000;
      budgetAmt.textContent = fmtINR(totalBudget);
      // Initialize remaining to total on filter change; it will be recomputed on submit
      if(remainingAmt) remainingAmt.textContent = fmtINR(totalBudget - totalSubmittedCost);

      const ready = selection.year && selection.installment && selection.grantType && selection.program;
      const isUntied = selection.grantType === 'Untied Grant';
      const isProgramOk = selection.program === 'RADP' || selection.program === 'ADP';
      if(ready && isUntied && isProgramOk){
        show(summaryPanel); show(radpFormPanel);
        const pt = document.getElementById('programTitle');
        if(pt) pt.textContent = selection.program;
      } else {
        if(!ready) hide(summaryPanel);
        hide(radpFormPanel);
      }
    }

    function updateCRVisibility(){
      const details = [
        document.getElementById('crNumberField'),
        document.getElementById('crDateField'),
        document.getElementById('crCopyField'),
        document.getElementById('numberOfWorksField')
      ];
      const isCR = crStatusCR && crStatusCR.checked;
      details.forEach((el) => { if(!el) return; isCR ? show(el) : hide(el); });
      // When in the middle of an active CR run, lock CR number/date/No. of Works but keep visible
      if(isCR && activeCR){
        if(crNumber){ crNumber.disabled = true; }
        if(crDate){ crDate.disabled = true; }
        if(numberOfWorks){ numberOfWorks.disabled = true; }
      } else {
        if(crNumber){ crNumber.disabled = false; }
        if(crDate){ crDate.disabled = false; }
        if(numberOfWorks){ numberOfWorks.disabled = false; }
      }
    }

    function clearRadpForm(){
      if(workType) workType.value = '';
      if(proposalName) proposalName.value = '';
      if(locationField) locationField.value = '';
      if(latlong) latlong.value = '';
      if(estimatedCost) estimatedCost.value = '';
      if(prioritization) prioritization.value = '';
      if(image) image.value = '';
      if(crStatusCR) crStatusCR.checked = false;
      if(crStatusIA) crStatusIA.checked = false;
      if(crNumber) crNumber.value = '';
      if(numberOfWorks) numberOfWorks.value = '';
      if(crDate) crDate.value = '';
      if(crCopy) crCopy.value = '';
      updateCRVisibility();
    }

    // Login
    loginBtn.addEventListener('click', () => {
      const u = username.value.trim();
      const p = password.value;
      
      // Check admin credentials
      if(u === CREDENTIALS.admin.username && p === CREDENTIALS.admin.password){
        currentUser = 'admin';
        hide(loginError);
        hide(loginPanel);
        show(dashboard);
        hide(commissionerDashboard);
        userBadge.textContent = 'Signed in as ' + u;
        show(userBadge);
        show(adminLogoutBtn);
      } 
      // Check commissioner credentials
      else if(u === CREDENTIALS.commissioner.username && p === CREDENTIALS.commissioner.password){
        currentUser = 'commissioner';
        hide(loginError);
        hide(loginPanel);
        hide(dashboard);
        show(commissionerDashboard);
        userBadge.textContent = 'Signed in as ' + u;
        show(userBadge);
        hide(adminLogoutBtn);
        loadCommissionerData();
      } 
      else {
        loginError.classList.remove('hidden');
      }
    });

    // Cascading dropdown logic
    year.addEventListener('change', (e) => {
      selection.year = e.target.value;
      installment.disabled = !selection.year;
      if(!selection.year){
        selection.installment = ''; selection.grantType = ''; selection.program = '';
        installment.value=''; grantType.value=''; program.value='';
        grantType.disabled = true; program.disabled = true;
      }
      refreshUI();
    });

    installment.addEventListener('change', (e) => {
      selection.installment = e.target.value;

      // Enable Grant Type only for First Installment as requested
      const first = selection.installment === 'First Installment';
      grantType.disabled = !first;
      if(!first){
        selection.grantType = ''; selection.program = '';
        grantType.value=''; program.value='';
        program.disabled = true;
      }
      refreshUI();
    });

    grantType.addEventListener('change', (e) => {
      selection.grantType = e.target.value;

      // Program enabled only if Grant Type selected, per flow
      const enableProgram = !!selection.grantType;
      program.disabled = !enableProgram;
      if(!enableProgram){
        selection.program = ''; program.value='';
      }
      refreshUI();
    });

    program.addEventListener('change', (e) => {
      selection.program = e.target.value;
      refreshUI();
    });

    // CR status toggle
    if(crStatusCR) crStatusCR.addEventListener('change', () => { updateCRVisibility(); updateForwardEligibility(); });
    if(crStatusIA) crStatusIA.addEventListener('change', () => { updateCRVisibility(); updateForwardEligibility(); });
    if(numberOfWorks) numberOfWorks.addEventListener('input', updateForwardEligibility);

    let totalSubmittedCost = 0;
    // Tracks current CR cycle so CR number/date aren't asked repeatedly until target works are submitted
    let activeCR = null; // { crNumber: string, crDate: string, targetCount: number, submittedCount: number }

    // Submit action
    submitBtn.addEventListener('click', () => {
      hide(successMsg);
      formError.textContent = '';
      hide(formError);

      const errors = [];
      if(!workType.value) errors.push('Select name of the sector.');
      if(!proposalName.value.trim()) errors.push('Enter proposal name.');
      if(!locationField.value.trim()) errors.push('Enter locality.');
      if(!latlong.value.trim()) errors.push('Enter latitude/longitude or Google Maps URL.');
      const estVal = Number(estimatedCost.value);
      if(!(estimatedCost.value && isFinite(estVal) && estVal > 0)) errors.push('Enter valid estimated cost (> 0).');
      const prioVal = Number(prioritization.value);
      if(!(prioritization.value && Number.isInteger(prioVal) && prioVal >= 1)) errors.push('Enter prioritization as a whole number (>= 1).');

      // Check for low balance
      const totalBudget = 1000000;
      const remaining = Math.max(0, totalBudget - totalSubmittedCost);
      if(remaining === 0) {
        errors.push('Low balance! Cannot submit more works. Remaining balance is ₹0.');
      } else if(estVal > remaining) {
        errors.push(`Insufficient balance! Estimated cost (${fmtINR(estVal)}) exceeds remaining balance (${fmtINR(remaining)}).`);
      }

      const isCRSelected = crStatusCR && crStatusCR.checked;
      if(isCRSelected){
        const inActiveCRWindow = !!activeCR && activeCR.submittedCount < activeCR.targetCount;
        const crNumVal = (crNumber?.value || '').trim();
        const worksVal = Number(numberOfWorks?.value || 0);
        const dateVal = crDate?.value || '';

        if(!inActiveCRWindow){
          if(!crNumVal) errors.push('Enter CR number.');
          if(!(Number.isInteger(worksVal) && worksVal >= 1)) errors.push('Enter valid number of works.');
          if(!dateVal) errors.push('Select CR date.');
        }
        // Detailed report remains required per work
        if(!(crCopy?.files && crCopy.files.length > 0)) errors.push('Upload detailed estimation report.');
      }

      if(errors.length){
        formError.textContent = errors.join(' ');
        show(formError);
        return;
      }

      // Record submission
      const record = {
        sector: workType.value,
        proposal: proposalName.value.trim(),
        cost: estVal,
        locality: locationField.value.trim(),
        latlong: latlong.value.trim(),
        priority: prioVal,
        crNumber: '',
        crDate: '',
        workImage: image?.files?.[0] || null,
        detailedReport: crCopy?.files?.[0] || null
      };
      // Apply CR number/date: use activeCR if running, else take from form and initialize activeCR
      if(isCRSelected){
        const inActiveCRWindow = !!activeCR && activeCR.submittedCount < activeCR.targetCount;
        if(inActiveCRWindow){
          record.crNumber = activeCR.crNumber;
          record.crDate = activeCR.crDate;
        } else {
          const targetCount = Number(numberOfWorks?.value || 0) || 1;
          activeCR = {
            crNumber: (crNumber?.value || '').trim(),
            crDate: crDate?.value || '',
            targetCount,
            submittedCount: 0
          };
          record.crNumber = activeCR.crNumber;
          record.crDate = activeCR.crDate;
        }
      }
      submissions.push(record);

      // Update totals
      totalSubmittedCost += estVal;
      if(remainingAmt){
        const totalBudget = 1000000;
        const remaining = Math.max(0, totalBudget - totalSubmittedCost);
        remainingAmt.textContent = fmtINR(remaining);
        remainingAmt.style.color = remaining === 0 ? '#ef4444' : '#22c55e';
      }

      // Update activeCR counters and field states after submission
      if(isCRSelected && activeCR){
        activeCR.submittedCount += 1;
        if(activeCR.submittedCount >= activeCR.targetCount){
          // CR cycle complete, unlock fields for next cycle
          activeCR = null;
        }
      }
      updateFieldStates();

      // Update table with merged sectors
      updateSubmissionTable();

      // Reveal signature + table section
      show(postSubmitPanel);

      show(successMsg);
      setTimeout(() => { hide(successMsg); }, 4000);
      updateForwardEligibility();

      // Clear form for next entry (keep Number of Works for target tracking)
      const cacheNoW = numberOfWorks?.value || '';
      clearRadpForm();
      // Preserve CR visibility and values during active CR window
      if(activeCR){
        if(numberOfWorks) numberOfWorks.value = String(activeCR.targetCount);
        if(crStatusCR) crStatusCR.checked = true;
        if(crNumber) crNumber.value = activeCR.crNumber;
        if(crDate) crDate.value = activeCR.crDate;
      } else {
        if(numberOfWorks) numberOfWorks.value = cacheNoW;
      }
      updateCRVisibility();
    });

    function updateForwardEligibility(){
      if(!forwardCommissionerBtn) return;
      const requiredCount = Number(numberOfWorks?.value || 0);
      const worksOk = Number.isInteger(requiredCount) && requiredCount >= 1;
      // Keep button clickable when CR selected and number of works is valid,
      // actual gating happens on click with a precise message.
      const enable = (crStatusCR && crStatusCR.checked) && worksOk;
      forwardCommissionerBtn.disabled = !enable;
      forwardCommissionerBtn.style.opacity = enable ? '1' : '.6';
      forwardCommissionerBtn.style.cursor = enable ? 'pointer' : 'not-allowed';
    }

    function updateFieldStates(){
      // Disable fields after 3 works are submitted
      const submittedCount = submissions.length;
      const shouldDisable = submittedCount >= 3;
      
      if(crNumber) {
        crNumber.disabled = shouldDisable || !!activeCR;
        crNumber.style.opacity = shouldDisable ? '0.6' : '1';
        crNumber.style.cursor = shouldDisable ? 'not-allowed' : 'text';
      }
      
      if(crDate) {
        crDate.disabled = shouldDisable || !!activeCR;
        crDate.style.opacity = shouldDisable ? '0.6' : '1';
        crDate.style.cursor = shouldDisable ? 'not-allowed' : 'text';
      }
      
      if(numberOfWorks) {
        numberOfWorks.disabled = shouldDisable || !!activeCR;
        numberOfWorks.style.opacity = shouldDisable ? '0.6' : '1';
        numberOfWorks.style.cursor = shouldDisable ? 'not-allowed' : 'text';
        
        // Highlight in red if incomplete works
        const requiredCount = Number(numberOfWorks.value || 0);
        const isIncomplete = submittedCount < requiredCount && requiredCount > 0;
        numberOfWorks.style.borderColor = isIncomplete ? '#ef4444' : '';
        numberOfWorks.style.backgroundColor = isIncomplete ? '#fef2f2' : '';
      }
    }

    function updateSubmissionTable(){
      // Clear existing table rows
      submissionTableBody.innerHTML = '';
      
      // Group submissions by sector
      const sectorGroups = {};
      submissions.forEach((submission, index) => {
        const sector = submission.sector;
        if (!sectorGroups[sector]) {
          sectorGroups[sector] = [];
        }
        // Preserve stable index for edit actions
        sectorGroups[sector].push({ ...submission, __idx: index });
      });
      
      // Create rows for each sector group with merged cells
      let rowNumber = 1;
      Object.keys(sectorGroups).forEach(sector => {
        const group = sectorGroups[sector];
        
        group.forEach((item, index) => {
          const row = document.createElement('tr');
          // Attach stable index for reference
          row.setAttribute('data-index', String(item.__idx));
          
          // S.No cell - only show on first row of each sector group
          const sNoCell = document.createElement('td');
          sNoCell.style.padding = '8px';
          sNoCell.style.borderBottom = '1px solid var(--border)';
          sNoCell.style.textAlign = 'center';
          sNoCell.style.verticalAlign = 'top';
          if (index === 0) {
            sNoCell.textContent = rowNumber;
            sNoCell.rowSpan = group.length;
          } else {
            sNoCell.style.display = 'none'; // Hide for subsequent rows
          }
          row.appendChild(sNoCell);
          
          // Sector cell - only show on first row of each sector group
          const sectorCell = document.createElement('td');
          sectorCell.style.padding = '8px';
          sectorCell.style.borderBottom = '1px solid var(--border)';
          sectorCell.style.verticalAlign = 'top';
          if (index === 0) {
            sectorCell.textContent = sector;
            sectorCell.rowSpan = group.length;
          } else {
            sectorCell.style.display = 'none'; // Hide for subsequent rows
          }
          row.appendChild(sectorCell);
          
          // Proposal name
          const proposalCell = document.createElement('td');
          proposalCell.style.padding = '8px';
          proposalCell.style.borderBottom = '1px solid var(--border)';
          proposalCell.textContent = item.proposal;
          row.appendChild(proposalCell);
          
          // Estimated cost
          const costCell = document.createElement('td');
          costCell.style.padding = '8px';
          costCell.style.borderBottom = '1px solid var(--border)';
          costCell.style.textAlign = 'right';
          costCell.textContent = fmtINR(Math.round(item.cost)).replace(/\s/g,' ');
          row.appendChild(costCell);
          
          // Locality
          const localityCell = document.createElement('td');
          localityCell.style.padding = '8px';
          localityCell.style.borderBottom = '1px solid var(--border)';
          localityCell.textContent = item.locality;
          row.appendChild(localityCell);
          
          // Priority
          const priorityCell = document.createElement('td');
          priorityCell.style.padding = '8px';
          priorityCell.style.borderBottom = '1px solid var(--border)';
          priorityCell.style.textAlign = 'center';
          priorityCell.textContent = String(item.priority);
          row.appendChild(priorityCell);
          
          // Work Image
          const imageCell = document.createElement('td');
          imageCell.style.padding = '8px';
          imageCell.style.borderBottom = '1px solid var(--border)';
          imageCell.style.textAlign = 'center';
          if (item.workImage) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(item.workImage);
            img.style.width = '50px';
            img.style.height = '50px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px';
            img.style.cursor = 'pointer';
            img.title = 'Click to view full size';
            img.addEventListener('click', () => {
              const modal = document.createElement('div');
              modal.style.position = 'fixed';
              modal.style.top = '0';
              modal.style.left = '0';
              modal.style.width = '100%';
              modal.style.height = '100%';
              modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
              modal.style.display = 'flex';
              modal.style.justifyContent = 'center';
              modal.style.alignItems = 'center';
              modal.style.zIndex = '1000';
              modal.style.cursor = 'pointer';
              
              const fullImg = document.createElement('img');
              fullImg.src = img.src;
              fullImg.style.maxWidth = '90%';
              fullImg.style.maxHeight = '90%';
              fullImg.style.borderRadius = '8px';
              
              modal.appendChild(fullImg);
              document.body.appendChild(modal);
              modal.addEventListener('click', () => {
                document.body.removeChild(modal);
              });
            });
            imageCell.appendChild(img);
          } else {
            imageCell.textContent = 'No image';
            imageCell.style.color = '#64748b';
          }
          row.appendChild(imageCell);
          
          // Detailed Report
          const reportCell = document.createElement('td');
          reportCell.style.padding = '8px';
          reportCell.style.borderBottom = '1px solid var(--border)';
          reportCell.style.textAlign = 'center';
          if (item.detailedReport) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(item.detailedReport);
            link.target = '_blank';
            link.textContent = 'View Report';
            link.style.color = '#2563eb';
            link.style.textDecoration = 'none';
            link.style.fontSize = '12px';
            reportCell.appendChild(link);
          } else {
            reportCell.textContent = 'No report';
            reportCell.style.color = '#64748b';
          }
          row.appendChild(reportCell);
          
          // Actions
          const actionsCell = document.createElement('td');
          actionsCell.style.padding = '8px';
          actionsCell.style.borderBottom = '1px solid var(--border)';
          actionsCell.style.textAlign = 'center';
          
          const editBtn = document.createElement('button');
          editBtn.textContent = 'Edit';
          editBtn.style.padding = '4px 8px';
          editBtn.style.fontSize = '12px';
          editBtn.style.backgroundColor = '#2563eb';
          editBtn.style.color = 'white';
          editBtn.style.border = 'none';
          editBtn.style.borderRadius = '4px';
          editBtn.style.cursor = 'pointer';
          editBtn.addEventListener('click', () => editSubmission(item.__idx));
          
          actionsCell.appendChild(editBtn);
          row.appendChild(actionsCell);
          
          submissionTableBody.appendChild(row);
        });
        rowNumber++;
      });
    }

    function editSubmission(index) {
      const submission = submissions[index];
      if (!submission) return;
      
      // Populate ALL form fields with existing data
      workType.value = submission.sector;
      proposalName.value = submission.proposal;
      locationField.value = submission.locality;
      latlong.value = submission.latlong || '';
      estimatedCost.value = submission.cost;
      prioritization.value = submission.priority;
      
      // Handle CR fields
      if (submission.crNumber) {
        crNumber.value = submission.crNumber;
        crStatusCR.checked = true;
      } else {
        crStatusIA.checked = true;
      }
      if (submission.crDate) {
        crDate.value = submission.crDate;
      }
      
      // Handle file fields - create new file inputs with existing files
      if (submission.workImage) {
        // Create a new file input and set the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(submission.workImage);
        image.files = dataTransfer.files;
      }
      
      if (submission.detailedReport) {
        // Create a new file input and set the file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(submission.detailedReport);
        crCopy.files = dataTransfer.files;
      }
      
      // Update CR visibility
      updateCRVisibility();
      
      // Remove the submission from the array
      submissions.splice(index, 1);
      
      // Update totals
      totalSubmittedCost -= submission.cost;
      if(remainingAmt){
        const totalBudget = 1000000;
        const remaining = Math.max(0, totalBudget - totalSubmittedCost);
        remainingAmt.textContent = fmtINR(remaining);
        remainingAmt.style.color = remaining === 0 ? '#ef4444' : '#22c55e';
      }
      
      // Update table
      updateSubmissionTable();
      updateFieldStates();
      
      // Scroll to form
      radpFormPanel.scrollIntoView({ behavior: 'smooth' });
    }

    // Forward to Commissioner
    if(forwardCommissionerBtn){
      forwardCommissionerBtn.disabled = true; // start disabled per rule
      forwardCommissionerBtn.style.opacity = '.6';
      forwardCommissionerBtn.style.cursor = 'not-allowed';
      forwardCommissionerBtn.addEventListener('click', () => {
        const requiredCount = Number(numberOfWorks?.value || 0);
        const submittedCount = submissions.length;
        if(!(Number.isInteger(requiredCount) && requiredCount >= 1)){
          alert('Please enter a valid Number of Works (>= 1).');
          return;
        }
        if(submittedCount < requiredCount){
          const remaining = requiredCount - submittedCount;
          // Visually highlight Number of Works as incomplete
          if(numberOfWorks){
            numberOfWorks.style.borderColor = '#ef4444';
            numberOfWorks.style.backgroundColor = '#fef2f2';
          }
          alert('You need to add and submit ' + remaining + ' more work' + (remaining === 1 ? '' : 's') + ' before forwarding.');
          return;
        }
        const missing = [];
        if(!(committeeSignature?.files && committeeSignature.files.length > 0)) missing.push('committee signature');
        if(!(councilResolutionSignature?.files && councilResolutionSignature.files.length > 0)) missing.push('council resolution signature');
        if(missing.length){
          alert('Please upload ' + missing.join(' and ') + ' before forwarding.');
          return;
        }
        
        // Capture any uploaded committee/council files and attach to each forwarded submission
        const committeeFile = committeeSignature?.files?.[0] || null;
        const councilFile = councilResolutionSignature?.files?.[0] || null;

        forwardedSubmissions.push(...submissions.map(sub => ({
          ...sub,
          id: Date.now() + Math.random(),
          status: 'Pending Review',
          remarks: '',
          forwardedDate: new Date().toISOString(),
          // Attach copies of the uploaded files so commissioner preview can show them
          committeeReport: committeeFile,
          councilResolution: councilFile
        })));
        
        // Clear admin submissions and reset totals
        submissions.length = 0;
        totalSubmittedCost = 0;
        if(remainingAmt){
          remainingAmt.textContent = fmtINR(1000000);
          remainingAmt.style.color = '#e10d0d';
        }

        // Clear the uploaded signature inputs to avoid accidental reuse
        if (committeeSignature) committeeSignature.value = '';
        if (councilResolutionSignature) councilResolutionSignature.value = '';

        alert('Forwarded to Commissioner');
      });
    }

    // Commissioner functionality
    function loadCommissionerData() {
      commissionerTableBody.innerHTML = '';
      
      forwardedSubmissions.forEach((submission, index) => {
        const row = document.createElement('tr');
        row.setAttribute('data-submission-id', String(submission.id));
        
        const cells = [
          index + 1,
          submission.sector,
          submission.proposal,
          fmtINR(Math.round(submission.cost)).replace(/\s/g,' '),
          submission.locality,
          submission.priority,
          submission.crNumber || 'N/A',
          submission.crDate || 'N/A',
          submission.status
        ];
        
        cells.forEach((cellData) => {
          const cell = document.createElement('td');
          cell.style.padding = '8px';
          cell.style.borderBottom = '1px solid var(--border)';
          cell.textContent = cellData;
          row.appendChild(cell);
        });
        
        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.style.padding = '8px';
        actionsCell.style.borderBottom = '1px solid var(--border)';
        actionsCell.style.textAlign = 'center';
        
        // Helper function to create styled buttons
        const createActionButton = (text, color, onClick) => {
          const btn = document.createElement('button');
          btn.textContent = text;
          btn.style.padding = '4px 8px';
          btn.style.fontSize = '12px';
          btn.style.color = 'white';
          btn.style.border = 'none';
          btn.style.borderRadius = '4px';
          btn.style.marginRight = '8px';
          
          // Determine if button should be disabled
          const isDisabled = submission.status === 'Approved' || submission.status === 'Rejected';
          btn.disabled = isDisabled;
          btn.style.backgroundColor = isDisabled ? '#94a3b8' : color;
          btn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
          
          if (!isDisabled && onClick) {
            btn.addEventListener('click', onClick);
          }
          
          // Set appropriate tooltip
          if (isDisabled) {
            btn.title = `Action disabled - submission is ${submission.status.toLowerCase()}`;
          }
          
          return btn;
        };
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.style.padding = '4px 8px';
        editBtn.style.fontSize = '12px';
        editBtn.style.color = 'white';
        editBtn.style.border = 'none';
        editBtn.style.borderRadius = '4px';
        editBtn.style.marginRight = '8px';

        // Determine if button should be disabled
        const isEditDisabled = submission.status === 'Verified' || 
                             submission.status === 'Approved' || 
                             submission.status === 'Rejected';

        editBtn.disabled = isEditDisabled;
        editBtn.style.backgroundColor = isEditDisabled ? '#94a3b8' : '#2563eb';
        editBtn.style.cursor = isEditDisabled ? 'not-allowed' : 'pointer';
        editBtn.style.opacity = isEditDisabled ? '0.6' : '1';

        // Set appropriate tooltip based on status
        if (submission.status === 'Verified') {
          editBtn.title = 'Editing disabled - item is verified';
        } else if (submission.status === 'Approved') {
          editBtn.title = 'Editing disabled - item is approved';
        } else if (submission.status === 'Rejected') {
          editBtn.title = 'Editing disabled - item is rejected';
        }

        if (!isEditDisabled) {
          editBtn.addEventListener('click', () => showEditablePreview(submission));
        }
        
        actionsCell.appendChild(editBtn);
        
        // Add approve/reject buttons for verified items; if already approved/rejected disable both
        console.log('Submission status:', submission.status);
        if (submission.status === 'Verified' || submission.status === 'Approved' || submission.status === 'Rejected') {
          console.log('Adding approve/reject buttons for verified/approved/rejected submission');
          
          // Approve button
          const approveBtn = document.createElement('button');
          approveBtn.textContent = 'Approve';
          approveBtn.style.padding = '4px 8px';
          approveBtn.style.fontSize = '12px';
          approveBtn.style.backgroundColor = submission.status === 'Approved' ? '#94a3b8' : '#22c55e';
          approveBtn.style.color = 'white';
          approveBtn.style.border = 'none';
          approveBtn.style.borderRadius = '4px';
          approveBtn.style.marginRight = '8px';
          approveBtn.style.cursor = submission.status === 'Approved' || submission.status === 'Rejected' ? 'not-allowed' : 'pointer';
          if (submission.status === 'Approved' || submission.status === 'Rejected') {
            approveBtn.disabled = true;
            approveBtn.title = submission.status === 'Approved' ? 'Already approved' : 'Item rejected';
          } else {
            approveBtn.addEventListener('click', () => approveSubmission(submission.id));
          }
          actionsCell.appendChild(approveBtn);

          // Reject button
          const rejectBtn = document.createElement('button');
          rejectBtn.textContent = 'Reject';
          rejectBtn.style.padding = '4px 8px';
          rejectBtn.style.fontSize = '12px';
          rejectBtn.style.backgroundColor = submission.status === 'Rejected' ? '#94a3b8' : '#ef4444';
          rejectBtn.style.color = 'white';
          rejectBtn.style.border = 'none';
          rejectBtn.style.borderRadius = '4px';
          rejectBtn.style.cursor = submission.status === 'Approved' || submission.status === 'Rejected' ? 'not-allowed' : 'pointer';
          if (submission.status === 'Approved' || submission.status === 'Rejected') {
            rejectBtn.disabled = true;
            rejectBtn.title = submission.status === 'Rejected' ? 'Already rejected' : 'Item approved';
          } else {
            rejectBtn.addEventListener('click', () => rejectSubmission(submission.id));
          }
          actionsCell.appendChild(rejectBtn);
        }
        row.appendChild(actionsCell);
        
        commissionerTableBody.appendChild(row);
      });
    }
    
    function showEditablePreview(submission) {
      previewContent.innerHTML = `
        <div class="grid">
          <div class="field">
            <label>Sector</label>
            <input type="text" value="${submission.sector}" id="editSector" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px;" />
          </div>
          <div class="field">
            <label>Proposal Name</label>
            <input type="text" value="${submission.proposal}" id="editProposal" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px;" />
          </div>
          <div class="field">
            <label>Estimated Cost</label>
            <input type="number" value="${submission.cost}" id="editCost" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px;" />
          </div>
          <div class="field">
            <label>Locality</label>
            <textarea id="editLocality" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px; min-height: 60px;">${submission.locality}</textarea>
          </div>
          <div class="field">
            <label>Latitude/Longitude</label>
            <textarea id="editLatlong" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px; min-height: 60px;">${submission.latlong || ''}</textarea>
          </div>
          <div class="field">
            <label>Priority</label>
            <input type="number" value="${submission.priority}" id="editPriority" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px;" />
          </div>
          <div class="field">
            <label>CR Number</label>
            <input type="text" value="${submission.crNumber || ''}" id="editCrNumber" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px;" />
          </div>
          <div class="field">
            <label>CR Date</label>
            <input type="date" value="${submission.crDate || ''}" id="editCrDate" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 6px;" />
          </div>
          <div class="field">
            <label>Status</label>
            <div style="padding: 8px; background: #f8fafc; border-radius: 6px;">${submission.status}</div>
          </div>
          <div class="field">
            <label>Forwarded Date</label>
            <div style="padding: 8px; background: #f8fafc; border-radius: 6px;">${new Date(submission.forwardedDate).toLocaleDateString()}</div>
          </div>
        </div>
        ${submission.workImage ? `
          <div class="field" style="margin-top: 16px;">
            <label>Work Image</label>
            <img src="${URL.createObjectURL(submission.workImage)}" style="max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid var(--border);" />
          </div>
        ` : ''}
        <!-- Render unique file links only once and group labels when multiple roles point to the same file -->
        ${(() => {
          // Gather files with labels
          const files = [];
          if (submission.detailedReport) files.push({ label: 'Detailed Report', file: submission.detailedReport });
          if (submission.committeeReport) files.push({ label: 'Committee Report', file: submission.committeeReport });
          if (submission.councilResolution) files.push({ label: 'Council Resolution Report', file: submission.councilResolution });

          if (files.length === 0) return '';

          // Deduplicate by name+size (both available on File objects)
          const seen = {};
          const parts = [];
          files.forEach(({ label, file }) => {
            // Fallback key for non-File objects
            const key = (file && file.name ? file.name : JSON.stringify(file)) + '|' + (file && typeof file.size === 'number' ? file.size : '0');
            if (!seen[key]) {
              seen[key] = { file, labels: [label] };
            } else {
              seen[key].labels.push(label);
            }
          });

          Object.values(seen).forEach(({ file, labels }) => {
            const joinedLabel = labels.join(' / ');
            parts.push(`<div class="field" style="margin-top: 16px;"><label>${joinedLabel}</label><a href="${URL.createObjectURL(file)}" target="_blank" style="color: #2563eb; text-decoration: none; margin-left:8px;">View</a></div>`);
          });

          return parts.join('\n');
        })()}
      `;
      
  commissionerRemarks.value = submission.remarks || '';
  saveRemarksBtn.dataset.submissionId = String(submission.id);
  // Allow saving even if remarks are empty so commissioner can verify quickly
  saveRemarksBtn.disabled = false;
      
  // No preview file inputs to clear (files are attached on forwarded submission)
      
      show(previewModal);
    }
    
    // Modal event listeners
    closePreviewBtn.addEventListener('click', () => {
      hide(previewModal);
    });
    
    commissionerRemarks.addEventListener('input', () => {
      saveRemarksBtn.disabled = !commissionerRemarks.value.trim();
    });
    
    saveRemarksBtn.addEventListener('click', () => {
      const currentSubmission = forwardedSubmissions.find(sub => 
        String(sub.id) === String(saveRemarksBtn.dataset.submissionId || '')
      );
      const verifySuccess = document.getElementById('verifySuccess');
      if (currentSubmission) {
        // Validate that the forwarded submission already has the required attached files
        const hasCommitteeReport = !!currentSubmission.committeeReport;
        const hasCouncilResolution = !!currentSubmission.councilResolution;

        if (!hasCommitteeReport) {
          alert('Committee Report is missing on this forwarded submission. Please ask admin to attach it before verification.');
          return;
        }
        if (!hasCouncilResolution) {
          alert('Council Resolution is missing on this forwarded submission. Please ask admin to attach it before verification.');
          return;
        }

        // Update all editable fields
        currentSubmission.sector = document.getElementById('editSector').value;
        currentSubmission.proposal = document.getElementById('editProposal').value;
        currentSubmission.cost = Number(document.getElementById('editCost').value);
        currentSubmission.locality = document.getElementById('editLocality').value;
        currentSubmission.latlong = document.getElementById('editLatlong').value;
        currentSubmission.priority = Number(document.getElementById('editPriority').value);
        currentSubmission.crNumber = document.getElementById('editCrNumber').value;
        currentSubmission.crDate = document.getElementById('editCrDate').value;
        currentSubmission.remarks = commissionerRemarks.value.trim();
        currentSubmission.status = 'Verified';

        // Update UI: show inline success banner, refresh table, then close modal
        if (verifySuccess) {
          verifySuccess.textContent = 'Work verified successfully. Status updated to "Verified".';
          verifySuccess.classList.remove('hidden');
        }
        loadCommissionerData();

        // Close modal after a short delay so user sees the message
        setTimeout(() => {
          if (verifySuccess) verifySuccess.classList.add('hidden');
          hide(previewModal);
        }, 1400);
      }
    });
    
    function approveSubmission(submissionId) {
      console.log('Approving submission:', submissionId);
      const currentSubmission = forwardedSubmissions.find(sub => String(sub.id) === String(submissionId));
      const banner = document.getElementById('approveSuccessBanner');
      if (currentSubmission) {
        currentSubmission.status = 'Approved';
        loadCommissionerData();
        if (banner) {
          banner.classList.remove('hidden');
          setTimeout(() => { banner.classList.add('hidden'); }, 1600);
        }
        // Show post-approval forward panel and set currentApprovedId
        if (postApprovePanel) {
          currentApprovedId = String(currentSubmission.id);
          show(postApprovePanel);
          // reset fields
          if (deptSelect) { deptSelect.value = ''; }
          if (sectionSelect) { sectionSelect.innerHTML = '<option value="" selected>Select section</option>'; sectionSelect.disabled = true; }
          if (forwardRemarks) forwardRemarks.value = '';
          if (forwardToDeptBtn) { forwardToDeptBtn.disabled = true; forwardToDeptBtn.style.opacity = '.6'; }
          if (forwardSuccess) forwardSuccess.classList.add('hidden');
        }
      } else {
        console.log('Submission not found');
        alert('Error: Submission not found');
      }
    }

    function rejectSubmission(submissionId) {
      console.log('Rejecting submission:', submissionId);
      const currentSubmission = forwardedSubmissions.find(sub => String(sub.id) === String(submissionId));
      const banner = document.getElementById('rejectSuccessBanner');
      if (currentSubmission) {
        // Update status to rejected
        currentSubmission.status = 'Rejected';
        
        // First disable immediate buttons before table refresh
        const row = commissionerTableBody.querySelector(`tr[data-submission-id="${submissionId}"]`);
        if (row) {
          // Disable all buttons in the row
          const buttons = row.querySelectorAll('button');
          buttons.forEach(button => {
            // Disable the button
            button.disabled = true;
            // Apply consistent gray styling for disabled state
            button.style.backgroundColor = '#94a3b8';
            button.style.cursor = 'not-allowed';
            button.style.opacity = '0.6';
            
            // Set appropriate tooltips based on button type
            if (button.textContent === 'Edit') {
              button.title = 'Editing disabled - item is rejected';
            } else if (button.textContent === 'Approve') {
              button.title = 'Cannot approve - item is rejected';
            } else if (button.textContent === 'Reject') {
              button.title = 'Already rejected';
            }
            
            // Remove any existing click listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
          });
        }
        
        // Close preview modal if it's open
        const previewModal = document.getElementById('previewModal');
        if (previewModal && !previewModal.classList.contains('hidden')) {
          hide(previewModal);
        }
        
        // Refresh the table to show updated status
        loadCommissionerData();
        
        // Show the rejection success message
        if (banner) {
          banner.classList.remove('hidden');
          setTimeout(() => { banner.classList.add('hidden'); }, 1600);
        }
      } else {
        console.log('Submission not found');
        alert('Error: Submission not found');
      }
    }

    // Department -> Section mapping
    const sectionMap = {
      'Public Works': ['Roads', 'Drainage', 'Parks'],
      'Urban Development': ['Planning', 'Slum Redev', 'Infrastructure'],
      'Health': ['Hospitals', 'Vaccination', 'Sanitation'],
      'Education': ['Schools', 'Higher Ed', 'Adult Ed']
    };

    if (deptSelect) {
      deptSelect.addEventListener('change', (e) => {
        const d = e.target.value;
        if (!d) {
          sectionSelect.innerHTML = '<option value="" selected>Select section</option>';
          sectionSelect.disabled = true;
          forwardToDeptBtn.disabled = true;
          forwardToDeptBtn.style.opacity = '.6';
          return;
        }
        const secs = sectionMap[d] || [];
        sectionSelect.innerHTML = '<option value="" selected>Select section</option>' + secs.map(s => `<option>${s}</option>`).join('');
        sectionSelect.disabled = false;
        forwardToDeptBtn.disabled = true;
        forwardToDeptBtn.style.opacity = '.6';
      });
    }

    if (sectionSelect) {
      sectionSelect.addEventListener('change', (e) => {
        const s = e.target.value;
        const enabled = !!s && deptSelect && deptSelect.value;
        forwardToDeptBtn.disabled = !enabled;
        forwardToDeptBtn.style.opacity = enabled ? '1' : '.6';
      });
    }

    if (forwardToDeptBtn) {
      forwardToDeptBtn.addEventListener('click', () => {
        if (!currentApprovedId) return alert('No approved submission selected.');
        const sub = forwardedSubmissions.find(x => String(x.id) === String(currentApprovedId));
        if (!sub) return alert('Submission not found');
        sub.forwardedTo = { department: deptSelect.value, section: sectionSelect.value, remarks: forwardRemarks.value.trim(), forwardedAt: new Date().toISOString() };
        if (forwardSuccess) { forwardSuccess.classList.remove('hidden'); }
        // Optionally hide the panel after success
        setTimeout(() => { if (postApprovePanel) hide(postApprovePanel); if (forwardSuccess) forwardSuccess.classList.add('hidden'); }, 1400);
      });
    }
    
    // Logout functionality
    adminLogoutBtn.addEventListener('click', () => {
      currentUser = null;
      hide(dashboard);
      hide(commissionerDashboard);
      show(loginPanel);
      hide(userBadge);
      hide(adminLogoutBtn);
      username.value = '';
      password.value = '';
    });
    
    logoutBtn.addEventListener('click', () => {
      currentUser = null;
      hide(dashboard);
      hide(commissionerDashboard);
      show(loginPanel);
      hide(userBadge);
      hide(adminLogoutBtn);
      username.value = '';
      password.value = '';
    });

    // Initialize CR fields visibility on load
    updateCRVisibility();
    updateFieldStates();
  