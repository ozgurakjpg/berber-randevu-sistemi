/**
 * Erdi Erdem Hair Center - Application Logic
 * Encompasses: Navigation, Lightbox Gallery, Step Wizard, Dynamic Calendar, LocalStorage, and WhatsApp Booking Integration.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- STATE MANAGEMENT ---
    const state = {
        booking: {
            services: [],     // Selected service objects { id, name, price, duration }
            stylist: 'Erdi Erdem', // Default stylist
            date: null,        // Selected Date object
            time: null,        // Selected time string (e.g., "10:30")
            name: '',
            phone: '',
            notes: ''
        },
        currentStep: 1,
        calendar: {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            selectedDate: null
        },
        appointments: []
    };

    // Services Definition (matched with HTML IDs)
    const SERVICES_DATA = {
        1: { id: 1, name: "Saç Kesimi", price: 250, duration: 30 },
        2: { id: 2, name: "Sakal Tasarımı", price: 150, duration: 20 },
        3: { id: 3, name: "Saç & Sakal Kombin", price: 350, duration: 50 },
        4: { id: 4, name: "Saç Yıkama & Fön", price: 100, duration: 15 },
        5: { id: 5, name: "Cilt Bakımı & Maske", price: 150, duration: 30 },
        6: { id: 6, name: "Damat Tıraşı Paketi", price: 1000, duration: 90 }
    };

    // --- DOM ELEMENTS ---
    const header = document.querySelector('.main-header');
    const mainNav = document.getElementById('mainNav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Lightbox Elements
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxCaption = document.getElementById('lightboxCaption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const prevLightboxBtn = lightbox.querySelector('.lightbox-nav.prev');
    const nextLightboxBtn = lightbox.querySelector('.lightbox-nav.next');
    
    // Wizard Navigation Elements
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const stepContents = document.querySelectorAll('.wizard-step-content');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    // Calendar & Slots
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const calendarMonthYear = document.getElementById('calendarMonthYear');
    const calendarDays = document.getElementById('calendarDays');
    const slotsSelectedDateDisplay = document.getElementById('slotsSelectedDateDisplay');
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');

    // Contact Form Inputs
    const custNameInput = document.getElementById('custName');
    const custPhoneInput = document.getElementById('custPhone');
    const custNotesInput = document.getElementById('custNotes');
    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');

    // Appointments Elements
    const appointmentsList = document.getElementById('appointmentsList');
    const apptsCountBadge = document.getElementById('apptsCount');

    // Shortcut Buttons from Service Cards
    const selectServiceShortcuts = document.querySelectorAll('.select-service-shortcut');

    // Success Modal Elements
    const successModal = document.getElementById('successModal');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');
    const goToWhatsappBtn = document.getElementById('goToWhatsappBtn');

    // --- INITIALIZATION ---
    function init() {
        initNavigation();
        initLightbox();
        initBookingWizard();
        initCalendar();
        loadAppointments();
        updateServiceSelectionDisplay();
        initSuccessModal();
        
        // Default text for slots
        slotsSelectedDateDisplay.textContent = 'Lütfen takvimden tarih seçin';
    }

    // --- NAVIGATION LOGIC ---
    function initNavigation() {
        // Sticky Header scroll effect
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            updateActiveNavLink();
        });

        // Mobile Nav Toggle
        navToggle.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            const icon = navToggle.querySelector('i');
            if (mainNav.classList.contains('open')) {
                icon.className = 'fa-solid fa-xmark';
            } else {
                icon.className = 'fa-solid fa-bars';
            }
        });

        // Close Mobile Menu on Nav Link Click
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                mainNav.classList.remove('open');
                navToggle.querySelector('i').className = 'fa-solid fa-bars';
                
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Highlight active link by scroll section
        function updateActiveNavLink() {
            let fromTop = window.scrollY + 120;
            let currentActive = null;

            document.querySelectorAll('section').forEach(section => {
                if (section.offsetTop <= fromTop && section.offsetTop + section.offsetHeight > fromTop) {
                    currentActive = section.id;
                }
            });

            if (currentActive) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${currentActive}`) {
                        link.classList.add('active');
                    }
                });
            }
        }
    }

    // --- LIGHTBOX GALLERY LOGIC ---
    let currentLightboxIdx = 0;
    const galleryImages = [
        { src: 'assets/images/salon1.png', alt: 'Erdi Erdem Hair Center Salon İçi Görünüm - Koltuklar ve Aynalar' },
        { src: 'assets/images/salon2.png', alt: 'Erdi Erdem Hair Center Salon İçi Görünüm - Detaylı Bakış' }
    ];

    function initLightbox() {
        galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-image-index'), 10);
                openLightbox(index);
            });
        });

        lightboxClose.addEventListener('click', closeLightbox);
        
        // Close on clicking overlay
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (lightbox.style.display === 'flex') {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowRight') navigateLightbox(1);
                if (e.key === 'ArrowLeft') navigateLightbox(-1);
            }
        });

        prevLightboxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox(-1);
        });

        nextLightboxBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigateLightbox(1);
        });
    }

    function openLightbox(index) {
        currentLightboxIdx = index;
        const imgData = galleryImages[index];
        lightboxImg.src = imgData.src;
        lightboxCaption.textContent = imgData.alt;
        lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Lock scrolling
    }

    function closeLightbox() {
        lightbox.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }

    function navigateLightbox(direction) {
        currentLightboxIdx = (currentLightboxIdx + direction + galleryImages.length) % galleryImages.length;
        const imgData = galleryImages[currentLightboxIdx];
        lightboxImg.src = imgData.src;
        lightboxCaption.textContent = imgData.alt;
    }

    // --- SUCCESS MODAL LOGIC ---
    function initSuccessModal() {
        closeSuccessBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
        });
        
        successModal.addEventListener('click', (e) => {
            if (e.target === successModal) {
                successModal.classList.remove('active');
            }
        });
    }

    // --- WIZARD FORM LOGIC ---
    function initBookingWizard() {
        // Service cards direct selection shortcuts
        selectServiceShortcuts.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = parseInt(btn.getAttribute('data-service-id'), 10);
                
                // Check the checkbox in wizard step 1
                const checkbox = document.querySelector(`.services-list-form input[value="${serviceId}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    // Trigger change event to update calculations
                    const event = new Event('change', { bubbles: true });
                    checkbox.dispatchEvent(event);
                }

                // Update styling card
                const card = document.querySelector(`.service-checkbox-card[data-service-id="${serviceId}"]`);
                if (card) {
                    card.classList.add('selected-svc');
                }

                // Smooth scroll to booking section
                document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
                
                // Go to step 1 in Wizard
                goToStep(1);
            });
        });

        // Checkbox selection in step 1
        const serviceCheckboxes = document.querySelectorAll('.services-list-form input[type="checkbox"]');
        serviceCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const card = cb.closest('.service-checkbox-card');
                if (cb.checked) {
                    card.classList.add('selected-svc');
                } else {
                    card.classList.remove('selected-svc');
                }
                updateServiceSelectionDisplay();
            });
        });

        // Stylist Selection in step 2
        const stylistCards = document.querySelectorAll('.stylist-card');
        stylistCards.forEach(card => {
            card.addEventListener('click', () => {
                stylistCards.forEach(c => {
                    c.classList.remove('active-stylist');
                    const badge = c.querySelector('.stylist-select-badge');
                    badge.innerHTML = '<i class="fa-solid fa-circle"></i> Seç';
                });
                card.classList.add('active-stylist');
                card.querySelector('.stylist-select-badge').innerHTML = '<i class="fa-solid fa-circle-check"></i> Seçildi';
                
                state.booking.stylist = card.getAttribute('data-stylist-name');
            });
        });

        // Prev and Next Button Handlers
        prevBtn.addEventListener('click', () => {
            if (state.currentStep > 1) {
                goToStep(state.currentStep - 1);
            }
        });

        nextBtn.addEventListener('click', () => {
            if (validateStep(state.currentStep)) {
                goToStep(state.currentStep + 1);
            }
        });

        // Submit Button
        submitBtn.addEventListener('click', () => {
            submitBooking();
        });

        // Handle direct navigation indicator clicks (only to completed/active steps)
        stepIndicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const targetStep = parseInt(indicator.getAttribute('data-step'), 10);
                
                // Can navigate backwards freely, or forwards if current step is validated
                if (targetStep < state.currentStep) {
                    goToStep(targetStep);
                } else if (targetStep > state.currentStep) {
                    // Check validation for all intermediate steps
                    let canGo = true;
                    for (let s = state.currentStep; s < targetStep; s++) {
                        if (!validateStep(s)) {
                            canGo = false;
                            break;
                        }
                    }
                    if (canGo) {
                        goToStep(targetStep);
                    }
                }
            });
        });
    }

    function updateServiceSelectionDisplay() {
        const checkboxes = document.querySelectorAll('.services-list-form input[type="checkbox"]:checked');
        state.booking.services = [];
        
        let totalVal = 0;
        let totalDur = 0;

        checkboxes.forEach(cb => {
            const id = parseInt(cb.value, 10);
            const svc = SERVICES_DATA[id];
            if (svc) {
                state.booking.services.push(svc);
                totalVal += svc.price;
                totalDur += svc.duration;
            }
        });

        document.getElementById('selectedCount').textContent = state.booking.services.length;
        document.getElementById('totalDuration').textContent = totalDur;
        document.getElementById('totalPrice').textContent = totalVal;
    }

    function goToStep(stepNum) {
        state.currentStep = stepNum;

        // Hide all steps, display target step
        stepContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`step${stepNum}`).classList.add('active');

        // Update step indicator classes
        stepIndicators.forEach(ind => {
            const indStep = parseInt(ind.getAttribute('data-step'), 10);
            ind.classList.remove('active', 'completed');
            
            if (indStep === stepNum) {
                ind.classList.add('active');
            } else if (indStep < stepNum) {
                ind.classList.add('completed');
            }
        });

        // Update step lines
        const stepLines = document.querySelectorAll('.step-line');
        stepLines.forEach((line, index) => {
            line.classList.remove('completed');
            if (index < stepNum - 1) {
                line.classList.add('completed');
            }
        });

        // Configure footer buttons based on step
        if (stepNum === 1) {
            prevBtn.disabled = true;
        } else {
            prevBtn.disabled = false;
        }

        if (stepNum === 5) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
            buildSummary();
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }

        // Scroll to top of the wizard container for better UX on mobile
        document.querySelector('.booking-wizard-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function validateStep(stepNum) {
        if (stepNum === 1) {
            if (state.booking.services.length === 0) {
                alert('Lütfen en az bir hizmet seçiniz.');
                return false;
            }
            return true;
        }
        
        if (stepNum === 2) {
            // Stylist always has a default, so it's always valid
            return true;
        }

        if (stepNum === 3) {
            if (!state.booking.date) {
                alert('Lütfen takvimden bir tarih seçin.');
                return false;
            }
            if (!state.booking.time) {
                alert('Lütfen müsait bir saat dilimi seçin.');
                return false;
            }
            return true;
        }

        if (stepNum === 4) {
            let isValid = true;
            
            const name = custNameInput.value.trim();
            const phone = custPhoneInput.value.trim();

            if (!name) {
                document.getElementById('custName').parentElement.classList.add('has-error');
                nameError.style.display = 'block';
                isValid = false;
            } else {
                document.getElementById('custName').parentElement.classList.remove('has-error');
                nameError.style.display = 'none';
            }

            // Simple phone format validation (Turkish: 05xxxxxxxxx or similar, must have 10-11 digits)
            const cleanPhone = phone.replace(/\D/g, '');
            if (!phone || cleanPhone.length < 10 || cleanPhone.length > 11) {
                document.getElementById('custPhone').parentElement.classList.add('has-error');
                phoneError.style.display = 'block';
                isValid = false;
            } else {
                document.getElementById('custPhone').parentElement.classList.remove('has-error');
                phoneError.style.display = 'none';
            }

            if (isValid) {
                state.booking.name = name;
                state.booking.phone = phone;
                state.booking.notes = custNotesInput.value.trim();
            }

            return isValid;
        }

        return true;
    }

    function buildSummary() {
        const servicesText = state.booking.services.map(s => s.name).join(', ');
        const totalDuration = state.booking.services.reduce((acc, curr) => acc + curr.duration, 0);
        const totalPrice = state.booking.services.reduce((acc, curr) => acc + curr.price, 0);
        
        document.getElementById('sumServices').textContent = servicesText;
        document.getElementById('sumDuration').textContent = `${totalDuration} dk`;
        document.getElementById('sumStylist').textContent = state.booking.stylist;
        
        const formattedDate = formatDateTurkish(state.booking.date);
        document.getElementById('sumDateTime').textContent = `${formattedDate} - ${state.booking.time}`;
        document.getElementById('sumCustomer').textContent = state.booking.name;
        document.getElementById('sumPhone').textContent = state.booking.phone;
        
        if (state.booking.notes) {
            document.getElementById('sumNoteRow').style.display = 'flex';
            document.getElementById('sumNote').textContent = state.booking.notes;
        } else {
            document.getElementById('sumNoteRow').style.display = 'none';
        }
        
        document.getElementById('sumTotal').textContent = `${totalPrice} TL`;
    }

    // --- CUSTOM CALENDAR LOGIC ---
    const TurkishMonths = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
    ];

    function initCalendar() {
        renderCalendar(state.calendar.currentMonth, state.calendar.currentYear);

        prevMonthBtn.addEventListener('click', () => {
            // Lock backward navigation into the past
            const today = new Date();
            const minMonth = today.getMonth();
            const minYear = today.getFullYear();
            
            if (state.calendar.currentYear > minYear || (state.calendar.currentYear === minYear && state.calendar.currentMonth > minMonth)) {
                state.calendar.currentMonth--;
                if (state.calendar.currentMonth < 0) {
                    state.calendar.currentMonth = 11;
                    state.calendar.currentYear--;
                }
                renderCalendar(state.calendar.currentMonth, state.calendar.currentYear);
            }
        });

        nextMonthBtn.addEventListener('click', () => {
            // Restrict calendar booking up to 3 months into the future
            const today = new Date();
            const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 1);
            
            if (state.calendar.currentYear < maxDate.getFullYear() || (state.calendar.currentYear === maxDate.getFullYear() && state.calendar.currentMonth < maxDate.getMonth())) {
                state.calendar.currentMonth++;
                if (state.calendar.currentMonth > 11) {
                    state.calendar.currentMonth = 0;
                    state.calendar.currentYear++;
                }
                renderCalendar(state.calendar.currentMonth, state.calendar.currentYear);
            }
        });
    }

    function renderCalendar(month, year) {
        calendarDays.innerHTML = '';
        calendarMonthYear.textContent = `${TurkishMonths[month]} ${year}`;

        const today = new Date();
        today.setHours(0,0,0,0);

        // Get first day of the month and total days
        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday, etc.
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Convert Sunday index from 0 to 6 for standard alignment (Monday first)
        const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        // Render empty spaces for start offset
        for (let i = 0; i < startOffset; i++) {
            const emptyDiv = document.createElement('div');
            calendarDays.appendChild(emptyDiv);
        }

        // Render days
        for (let day = 1; day <= totalDays; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('calendar-day');
            dayDiv.textContent = day;

            const thisDate = new Date(year, month, day);
            const dayOfWeek = thisDate.getDay(); // 0 is Sunday

            // Disable past days and Sundays (Closed)
            const isPast = thisDate < today;
            const isSunday = dayOfWeek === 0;

            if (isPast || isSunday) {
                dayDiv.classList.add('disabled');
            } else {
                // Check if today
                if (thisDate.getTime() === today.getTime()) {
                    dayDiv.classList.add('today');
                }

                // Check if selected
                if (state.booking.date && thisDate.getTime() === state.booking.date.getTime()) {
                    dayDiv.classList.add('selected');
                }

                // Click event to select date
                dayDiv.addEventListener('click', () => {
                    selectDate(thisDate);
                    
                    // Highlight visually
                    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                    dayDiv.classList.add('selected');
                });
            }

            calendarDays.appendChild(dayDiv);
        }
    }

    function selectDate(date) {
        state.booking.date = date;
        state.booking.time = null; // Reset time slot on date change
        
        const formattedDate = formatDateTurkish(date);
        slotsSelectedDateDisplay.textContent = formattedDate;
        
        generateTimeSlots(date);
    }

    function generateTimeSlots(date) {
        timeSlotsGrid.innerHTML = '';
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        // Barber Working hours 09:00 - 20:00, 30 minute intervals
        const startHour = 9;
        const endHour = 20;
        
        let hasSlots = false;

        for (let hour = startHour; hour < endHour; hour++) {
            for (let min of ['00', '30']) {
                // If it's 19:30, that's the last slot. We don't take slots on or after 20:00
                if (hour === 19 && min === '30') continue; 
                
                const timeStr = `${hour.toString().padStart(2, '0')}:${min}`;
                const slotDiv = document.createElement('div');
                slotDiv.classList.add('time-slot');
                slotDiv.textContent = timeStr;

                // Validate if time slot is in the past (for today)
                if (isToday) {
                    const currentHour = today.getHours();
                    const currentMin = today.getMinutes();
                    const slotHourInt = hour;
                    const slotMinInt = parseInt(min, 10);
                    
                    // Add buffer of 30 minutes to not book slots too close to current time
                    const bufferTime = currentHour + (currentMin + 30) / 60;
                    const slotTime = slotHourInt + slotMinInt / 60;
                    
                    if (slotTime < bufferTime) {
                        slotDiv.classList.add('disabled');
                    }
                }

                if (!slotDiv.classList.contains('disabled')) {
                    hasSlots = true;
                    
                    // Event listener for selecting slot
                    slotDiv.addEventListener('click', () => {
                        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                        slotDiv.classList.add('selected');
                        state.booking.time = timeStr;
                    });
                }

                timeSlotsGrid.appendChild(slotDiv);
            }
        }

        if (!hasSlots) {
            timeSlotsGrid.innerHTML = '<div class="no-date-msg">Bugün için rezervasyon saatleri kapanmıştır. Lütfen başka bir gün seçin.</div>';
        }
    }

    // --- APPOINTMENTS LOCAL STORAGE MANAGEMENT ---
    function loadAppointments() {
        const stored = localStorage.getItem('berber_appointments');
        if (stored) {
            try {
                state.appointments = JSON.parse(stored).map(appt => {
                    // Convert back date string to date object
                    appt.date = new Date(appt.date);
                    return appt;
                });
            } catch (e) {
                state.appointments = [];
            }
        }
        renderAppointments();
    }

    function saveAppointments() {
        localStorage.setItem('berber_appointments', JSON.stringify(state.appointments));
        renderAppointments();
    }

    function renderAppointments() {
        // Remove past appointments logic if you wish, or keep them all. Let's keep them and flag past ones.
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Filter out appointments older than today (or keep them and style them differently. Let's keep upcoming ones first).
        const upcoming = state.appointments.filter(appt => appt.date >= today);
        
        apptsCountBadge.textContent = upcoming.length;
        if (upcoming.length > 0) {
            apptsCountBadge.style.display = 'inline-block';
        } else {
            apptsCountBadge.style.display = 'none';
        }

        if (state.appointments.length === 0) {
            appointmentsList.innerHTML = `
                <div class="no-appointments">
                    <i class="fa-solid fa-calendar-xmark icon-large"></i>
                    <p>Henüz kayıtlı bir randevunuz bulunmamaktadır.</p>
                    <a href="#booking" class="btn btn-gold btn-sm">Hemen Randevu Al</a>
                </div>
            `;
            return;
        }

        // Sort by date then time
        const sorted = [...state.appointments].sort((a, b) => {
            if (a.date.getTime() !== b.date.getTime()) {
                return a.date.getTime() - b.date.getTime();
            }
            return a.time.localeCompare(b.time);
        });

        appointmentsList.innerHTML = '';
        sorted.forEach((appt) => {
            const card = document.createElement('div');
            card.classList.add('appt-item-card');
            
            const formattedDate = formatDateTurkish(appt.date);
            const servicesText = appt.services.map(s => s.name).join(', ');
            
            // Check if past
            const isPast = appt.date < today;
            if (isPast) {
                card.style.opacity = '0.6';
            }

            card.innerHTML = `
                <div class="appt-details">
                    <h4>${appt.stylist} ${isPast ? '<span class="badge" style="background:#555;color:#fff;">Geçmiş</span>' : ''}</h4>
                    <div class="appt-services">${servicesText}</div>
                    <div class="appt-meta-info">
                        <span><i class="fa-regular fa-calendar-days"></i> ${formattedDate}</span>
                        <span><i class="fa-regular fa-clock"></i> ${appt.time}</span>
                        <span><i class="fa-solid fa-tags"></i> Toplam: ${appt.totalPrice} TL</span>
                    </div>
                </div>
                <div class="appt-actions">
                    ${!isPast ? `<button class="btn btn-sm btn-danger-outline cancel-appt-btn" data-appt-id="${appt.id}"><i class="fa-solid fa-trash-can"></i> İptal Et</button>` : ''}
                    <a href="https://wa.me/905052734069?text=${encodeURIComponent('Merhaba, ' + appt.dateTimeStr + ' tarihindeki randevum hakkında bilgi almak istiyorum.')}" target="_blank" class="btn btn-sm btn-gold"><i class="fa-brands fa-whatsapp"></i> İletişim</a>
                </div>
            `;

            // Bind cancel event
            const cancelBtn = card.querySelector('.cancel-appt-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    if (confirm('Bu randevuyu iptal etmek istediğinize emin misiniz? (Lütfen berberinize WhatsApp üzerinden de iptal bilgisini iletmeyi unutmayın)')) {
                        deleteAppointment(appt.id);
                    }
                });
            }

            appointmentsList.appendChild(card);
        });
    }

    function deleteAppointment(id) {
        state.appointments = state.appointments.filter(appt => appt.id !== id);
        saveAppointments();
    }

    // --- WHATSAPP INTEGRATION ---
    function submitBooking() {
        const totalPrice = state.booking.services.reduce((acc, curr) => acc + curr.price, 0);
        const totalDuration = state.booking.services.reduce((acc, curr) => acc + curr.duration, 0);
        const dateStr = formatDateTurkish(state.booking.date);
        
        const newAppt = {
            id: 'appt_' + Date.now(),
            services: state.booking.services,
            stylist: state.booking.stylist,
            date: state.booking.date,
            time: state.booking.time,
            totalPrice: totalPrice,
            dateTimeStr: `${dateStr} ${state.booking.time}`
        };

        // Save to state and localStorage
        state.appointments.push(newAppt);
        saveAppointments();

        // Construct WhatsApp message
        const servicesNames = state.booking.services.map(s => s.name).join(', ');
        
        let message = `Merhaba Erdi Erdem Hair Center, 
Randevu talebi oluşturmak istiyorum:

👤 İsim: ${state.booking.name}
📞 Telefon: ${state.booking.phone}
💇 Hizmetler: ${servicesNames} (Toplam: ${totalPrice} TL, Süre: ${totalDuration} dk)
💈 Stilist: ${state.booking.stylist}
📅 Tarih: ${dateStr}
⏰ Saat: ${state.booking.time}`;

        if (state.booking.notes) {
            message += `\n📝 Müşteri Notu: ${state.booking.notes}`;
        }

        // WhatsApp number
        const phoneNumber = '905052734069';
        const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

        // Configure Success Modal WhatsApp link
        goToWhatsappBtn.setAttribute('href', waUrl);

        // Show Success Modal
        successModal.classList.add('active');

        // Check if device is mobile to decide redirection logic
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // Mobile: use direct location assignment to trigger the app natively and bypass popups
            window.location.href = waUrl;
        } else {
            // Desktop: try window.open, fallback to location.href if blocked
            const newWindow = window.open(waUrl, '_blank');
            if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                window.location.href = waUrl;
            }
        }

        // Reset the form & Go back to step 1
        resetBookingForm();
        goToStep(1);
    }

    function resetBookingForm() {
        // Reset state values
        state.booking.services = [];
        state.booking.date = null;
        state.booking.time = null;
        state.booking.name = '';
        state.booking.phone = '';
        state.booking.notes = '';

        // Reset Form Inputs
        custNameInput.value = '';
        custPhoneInput.value = '';
        custNotesInput.value = '';

        // Reset check cards
        document.querySelectorAll('.service-checkbox-card input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        document.querySelectorAll('.service-checkbox-card').forEach(card => {
            card.classList.remove('selected-svc');
        });

        // Reset slots calendar visually
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
        slotsSelectedDateDisplay.textContent = 'Lütfen takvimden tarih seçin';
        timeSlotsGrid.innerHTML = '<div class="no-date-msg">Takvimden bir tarih seçtiğinizde saatler burada listelenecektir.</div>';

        updateServiceSelectionDisplay();
    }

    // --- HELPER FUNCTIONS ---
    function formatDateTurkish(date) {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = TurkishMonths[date.getMonth()];
        const year = date.getFullYear();
        const daysOfWeek = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
        const dayName = daysOfWeek[date.getDay()];
        return `${day} ${month} ${year}, ${dayName}`;
    }

    // Start application
    init();
});
