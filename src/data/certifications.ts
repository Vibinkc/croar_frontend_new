
export interface Certification {
    name: string;
}

export interface CertificationProvider {
    id: string;
    name: string;
    logo: string;
    certs: Certification[];
}

export const CERTIFICATION_DATA: Record<string, CertificationProvider> = {
    aws: {
        id: "aws",
        name: "Amazon Web Services (AWS)",
        logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
        certs: [
            { name: "AWS Certified Cloud Practitioner" },
            { name: "AWS Certified Solutions Architect – Associate" },
            { name: "AWS Certified Developer – Associate" },
            { name: "AWS Certified SysOps Administrator – Associate" },
            { name: "AWS Certified Solutions Architect – Professional" },
            { name: "AWS Certified DevOps Engineer – Professional" },
            { name: "AWS Certified Advanced Networking – Specialty" },
            { name: "AWS Certified Security – Specialty" },
            { name: "AWS Certified Machine Learning – Specialty" },
            { name: "AWS Certified Data Analytics – Specialty" },
            { name: "AWS Certified Database – Specialty" },
            { name: "AWS Certified SAP on AWS – Specialty" }
        ]
    },
    microsoft: {
        id: "microsoft",
        name: "Microsoft",
        logo: "https://www.vectorlogo.zone/logos/microsoft/microsoft-icon.svg",
        certs: [
            { name: "Microsoft Azure Fundamentals (AZ-900)" },
            { name: "Microsoft AI Fundamentals (AI-900)" },
            { name: "Microsoft Data Fundamentals (DP-900)" },
            { name: "Microsoft Security, Compliance & Identity Fundamentals (SC-900)" },
            { name: "Azure Administrator Associate (AZ-104)" },
            { name: "Azure Developer Associate (AZ-204)" },
            { name: "Azure Data Engineer Associate (DP-203)" },
            { name: "Azure AI Engineer Associate (AI-102)" },
            { name: "Power BI Data Analyst Associate (PL-300)" },
            { name: "Security Operations Analyst Associate (SC-200)" },
            { name: "Azure Solutions Architect Expert (AZ-305)" },
            { name: "DevOps Engineer Expert (AZ-400)" },
            { name: "Microsoft 365 Fundamentals (MS-900)" },
            { name: "Microsoft 365 Administrator Expert" }
        ]
    },
    gcp: {
        id: "gcp",
        name: "Google Cloud Platform (GCP)",
        logo: "https://www.vectorlogo.zone/logos/google_cloud/google_cloud-icon.svg",
        certs: [
            { name: "Google Cloud Digital Leader" },
            { name: "Associate Cloud Engineer" },
            { name: "Professional Cloud Architect" },
            { name: "Professional Data Engineer" },
            { name: "Professional Cloud Developer" },
            { name: "Professional DevOps Engineer" },
            { name: "Professional Cloud Security Engineer" },
            { name: "Professional Machine Learning Engineer" }
        ]
    },
    cybersecurity: {
        id: "cybersecurity",
        name: "Cybersecurity",
        logo: "https://www.comptia.org/_next/image/?url=https%3A%2F%2Fimages.cmp.optimizely.com%2F8623b0fab71111efac96d615e91762a5%3Fwidth%3D300%26height%3D300&w=640&q=90",
        certs: [
            { name: "CompTIA ITF+" },
            { name: "CompTIA A+" },
            { name: "CompTIA Network+" },
            { name: "CompTIA Security+" },
            { name: "CompTIA CySA+" },
            { name: "CompTIA PenTest+" },
            { name: "CompTIA CASP+" },
            { name: "CEH – Certified Ethical Hacker (EC-Council)" },
            { name: "CISSP – (ISC)²" },
            { name: "CCSP – (ISC)²" },
            { name: "CISM – ISACA" },
            { name: "CISA – ISACA" },
            { name: "OSCP – Offensive Security" }
        ]
    },
    salesforce: {
        id: "salesforce",
        name: "Salesforce",
        logo: "https://www.vectorlogo.zone/logos/salesforce/salesforce-icon.svg",
        certs: [
            { name: "Salesforce Certified Administrator" },
            { name: "Salesforce Advanced Administrator" },
            { name: "Salesforce Platform App Builder" },
            { name: "Salesforce Platform Developer I" },
            { name: "Salesforce Platform Developer II" },
            { name: "Salesforce Sales Cloud Consultant" },
            { name: "Salesforce Service Cloud Consultant" },
            { name: "Salesforce Marketing Cloud Consultant" },
            { name: "Salesforce Integration Architecture Designer" },
            { name: "Salesforce Technical Architect" }
        ]
    },
    servicenow: {
        id: "servicenow",
        name: "ServiceNow",
        logo: "https://www.vectorlogo.zone/logos/servicenow/servicenow-icon.svg",
        certs: [
            { name: "ServiceNow Certified System Administrator (CSA)" },
            { name: "ServiceNow Certified Application Developer (CAD)" },
            { name: "ServiceNow Implementation Specialist – ITSM" },
            { name: "ServiceNow Implementation Specialist – HRSD" },
            { name: "ServiceNow Implementation Specialist – CSM" },
            { name: "ServiceNow Certified Technical Architect" }
        ]
    },
    nvidia: {
        id: "nvidia",
        name: "NVIDIA",
        logo: "https://www.vectorlogo.zone/logos/nvidia/nvidia-icon.svg",
        certs: [
            { name: "NVIDIA Deep Learning Institute – Deep Learning" },
            { name: "NVIDIA Accelerated Computing with CUDA" },
            { name: "NVIDIA AI Infrastructure Certification" },
            { name: "NVIDIA Generative AI Fundamentals" },
            { name: "NVIDIA AI Enterprise Certification" }
        ]
    },
    amd: {
        id: "amd",
        name: "AMD",
        logo: "https://www.vectorlogo.zone/logos/amd/amd-icon.svg",
        certs: [
            { name: "AMD ROCm Developer Certification" },
            { name: "AMD GPU Computing Certification" },
            { name: "AMD AI Acceleration Fundamentals" }
        ]
    },
    intel: {
        id: "intel",
        name: "Intel",
        logo: "https://www.vectorlogo.zone/logos/intel/intel-icon.svg",
        certs: [
            { name: "Intel AI Fundamentals" },
            { name: "Intel AI Developer Certification" },
            { name: "Intel Edge AI Certification" },
            { name: "Intel FPGA Fundamentals" },
            { name: "Intel Hardware & Architecture Certification" }
        ]
    },
    ibm: {
        id: "ibm",
        name: "IBM",
        logo: "https://www.vectorlogo.zone/logos/ibm/ibm-icon.svg",
        certs: [
            { name: "IBM Data Science Professional Certificate" },
            { name: "IBM Data Analyst Professional Certificate" },
            { name: "IBM AI Engineering Professional Certificate" },
            { name: "IBM Machine Learning Professional Certificate" },
            { name: "IBM Cybersecurity Analyst Professional Certificate" },
            { name: "IBM Cloud Developer Certification" },
            { name: "IBM Cloud Architect Certification" }
        ]
    },
    blockchain: {
        id: "blockchain",
        name: "Blockchain",
        logo: "https://www.vectorlogo.zone/logos/ethereum/ethereum-icon.svg",
        certs: [
            { name: "Certified Blockchain Professional (CBP)" },
            { name: "Certified Blockchain Developer (CBD)" },
            { name: "Certified Ethereum Developer" },
            { name: "Hyperledger Fabric Administrator Certification" },
            { name: "Blockchain Security Professional" },
            { name: "Smart Contract Developer Certification" }
        ]
    },
    web3: {
        id: "web3",
        name: "Web3",
        logo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/Web3_logo.svg",
        certs: [
            { name: "Web3 Developer Certification" },
            { name: "DeFi Professional Certification" },
            { name: "NFT & Digital Asset Certification" },
            { name: "DAO Governance Certification" },
            { name: "Web3 Security Certification" }
        ]
    },
    ai: {
        id: "ai",
        name: "Artificial Intelligence",
        logo: "https://static.vecteezy.com/system/resources/previews/003/479/994/original/ai-artificial-intelligence-logo-in-hands-artificial-intelligence-and-machine-learning-concept-sphere-grid-wave-with-binary-code-big-data-innovation-technology-neural-networks-illustration-vector.jpg",
        certs: [
            { name: "TensorFlow Developer Certificate" },
            { name: "Google Professional Machine Learning Engineer" },
            { name: "AWS Certified Machine Learning – Specialty" },
            { name: "Microsoft Azure AI Engineer Associate" },
            { name: "NVIDIA Generative AI Certification" },
            { name: "IBM AI Engineering Professional Certificate" }
        ]
    }
};
