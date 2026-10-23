from backend.database.session import init_db, SessionLocal
from backend.synthetic.cases import seed_synthetic_case

def main():
    print("[*] Initializing TRACE database...")
    init_db()
    db = SessionLocal()
    try:
        print("[*] Seeding Synthetic Case A (Complete PowerShell Execution)...")
        case_a = seed_synthetic_case(db, case_type="complete")
        print(f"[+] Case A seeded successfully: {case_a.name} (UUID: {case_a.id})")

        print("[*] Seeding Synthetic Case B (Degraded Telemetry - Missing Execution Record)...")
        case_b = seed_synthetic_case(db, case_type="degraded")
        print(f"[+] Case B seeded successfully: {case_b.name} (UUID: {case_b.id})")
        print("[+] Ready for offline judge demonstration.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
