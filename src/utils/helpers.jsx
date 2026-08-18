import React from 'react';

export function getLeadPlatform(lead) {
  if (lead.platform) return lead.platform.toLowerCase();
  const url = (lead.sourceUrl || "").toLowerCase();
  if (url.includes("facebook.com")) return "facebook";
  if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("weworkremotely.com")) return "weworkremotely";
  if (url.includes("freelancer.com")) return "freelancer";
  if (url.includes("upwork.com")) return "upwork";
  if (url.includes("google.com/maps") || url.includes("google.co.in/maps")) return "google_maps";
  return "linkedin";
}

export function getPlatformIcon(platform, size = 14, style = {}) {
  const cleanPlatform = String(platform || "").toLowerCase().trim();
  if (cleanPlatform === "linkedin") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-svg" style={style}>
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" fill="#0A66C2"/>
      </svg>
    );
  } else if (cleanPlatform === "facebook") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-svg" style={style}>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
      </svg>
    );
  } else if (cleanPlatform === "twitter" || cleanPlatform === "twitter-x" || cleanPlatform === "x") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-svg" style={style}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>
      </svg>
    );
  } else if (cleanPlatform === "reddit") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-svg" style={style}>
        <path d="M24 11.5c0-1.65-1.35-3-3-3-.96 0-1.86.48-2.42 1.24-1.64-1-3.75-1.64-5.99-1.72l1.27-4 3.47.76c.02.77.65 1.38 1.42 1.38 1.3 0 2.25-1.07 2.25-2.25S19.98 1.68 18.78 1.68c-.9 0-1.68.6-1.92 1.4l-3.8-.8c-.1-.03-.24 0-.32.08-.1.08-.13.2-.1.32l-1.4 4.37c-2.4.05-4.63.69-6.33 1.73-.55-.74-1.44-1.2-2.39-1.2-1.65 0-3 1.35-3 3 0 1.12.6 2.12 1.52 2.64C1.94 13.14 1.8 14.05 1.8 15c0 4.14 4.86 7.5 10.82 7.5s10.82-3.36 10.82-7.5c0-.95-.15-1.86-.46-2.73.8-.57 1.38-1.5 1.38-2.61zm-19 3c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5zm11.72 4c-1.8 1.8-5.23 1.8-7.03 0-.15-.15-.15-.4 0-.54.15-.15.4-.15.54 0 1.5 1.5 4.45 1.5 5.95 0 .15-.15.4-.15.54 0 .15.15.15.4 0 .54zm-.22-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#FF4500"/>
      </svg>
    );
  } else if (cleanPlatform === "google_maps" || cleanPlatform === "google-maps" || cleanPlatform === "googlemaps") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-svg" style={style}>
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
      </svg>
    );
  } else if (cleanPlatform === "weworkremotely") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-svg" style={style}>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.882 17.514h-2.22l-1.905-6.522-1.922 6.522H9.63L7.042 7.74h2.17l1.492 6.304 1.89-6.304h1.758l1.874 6.304 1.508-6.304h2.128l-2.588 9.774z" fill="#FF3A59"/>
      </svg>
    );
  } else if (cleanPlatform === "freelancer") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-svg" style={style}>
        <path d="M12.986 2.502L22.56 9.47l-9.574 6.967v-13.935zm-1.972.109v13.717l-9.426-6.858 9.426-6.859zM2.574 11.23l18.852 6.858-9.426 3.414-9.426-10.272z" fill="#29B2FE"/>
      </svg>
    );
  } else if (cleanPlatform === "upwork") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" className="brand-svg" style={style}>
        <path d="M18.561 3.281c-2.822 0-4.836 1.895-5.632 4.673a11.13 11.13 0 0 0-2.316-4.101h-2.12v8.283c0 1.488-.636 2.109-1.922 2.109-1.286 0-1.923-.621-1.923-2.109V3.853H2.531v8.283c0 3.754 2.203 5.961 5.986 5.961 3.784 0 5.986-2.207 5.986-5.961v-1.636a8.91 8.91 0 0 1 1.621-3.693 4.148 4.148 0 0 0 2.438-3.791c0-2.109-1.21-3.732-4.001-3.732zm0 5.617c-.961 0-1.536-.789-1.536-1.885 0-1.096.575-1.885 1.536-1.885.961 0 1.536.789 1.536 1.885.001 1.096-.575 1.885-1.536 1.885z" fill="#14A800"/>
      </svg>
    );
  } else if (cleanPlatform === "government_tender" || cleanPlatform === "tender") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0EA5A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="brand-svg" style={style}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
    );
  } else {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="brand-svg" style={style}>
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    );
  }
}

export function getLeadAvatarUrl(name) {
  const cleanName = (name || "U").trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0EA5A4&color=fff&size=64&bold=true`;
}

export function getCompanyLogoUrl(company) {
  const cleanComp = (company || "C").trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanComp)}&background=037172&color=F8FAFC&size=48&bold=true`;
}

export function getStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("unqualified") || s.includes("not")) return "badge-danger";
  if (s.includes("qualif") || s.includes("prospect")) return "badge-success";
  if (s.includes("warm") || s.includes("potential")) return "badge-warning";
  if (s.includes("info")) return "badge-info";
  return "badge-neutral";
}

export function getIntentBadgeClass(intent) {
  const i = (intent || "").toLowerCase();
  if (i.includes("high") || i.includes("hiring")) return "badge-success";
  if (i.includes("med") || i.includes("warm") || i.includes("research")) return "badge-warning";
  if (i.includes("low")) return "badge-neutral";
  return "badge-neutral";
}

export function getCrmBadgeClass(crmStatus) {
  const s = (crmStatus || "New").toLowerCase();
  if (s === "new") return "badge-neutral";
  if (s === "new discovery") return "badge-success";
  if (s === "drafted") return "badge-info";
  if (s === "emailed") return "badge-warning";
  if (s === "replied") return "badge-success";
  if (s === "disqualified") return "badge-danger";
  return "badge-neutral";
}

export function parseIsoDate(str) {
  if (!str) return new Date(NaN);
  if (!str.includes("Z") && !str.includes("+") && str.includes("T")) {
    return new Date(str + "Z");
  }
  return new Date(str);
}
