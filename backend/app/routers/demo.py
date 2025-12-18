from fastapi import APIRouter
from typing import List

router = APIRouter(prefix="/api/demo", tags=["demo"])

# Pre-computed demo data (no API calls needed)
DEMO_NOTES = [
    {
        "id": "demo-1",
        "title": "Introduction to Machine Learning",
        "course_name": "CS 229 - Machine Learning",
        "summary": """Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. The field encompasses three main paradigms: supervised learning (learning from labeled examples), unsupervised learning (finding patterns in unlabeled data), and reinforcement learning (learning through interaction with an environment).

Key concepts include the bias-variance tradeoff, which describes the tension between model complexity and generalization ability. Overfitting occurs when a model learns noise in the training data rather than the underlying pattern, while underfitting happens when the model is too simple to capture the data's structure.

The course covers fundamental algorithms including linear regression, logistic regression, and neural networks. Understanding loss functions, gradient descent optimization, and regularization techniques forms the foundation for more advanced topics.""",
        "key_concepts": [
            "Supervised vs Unsupervised Learning",
            "Bias-Variance Tradeoff",
            "Gradient Descent",
            "Overfitting and Regularization",
            "Cross-Validation",
            "Neural Networks Basics",
            "Loss Functions"
        ],
        "flashcards": [
            {"id": "fc-1", "front": "What is the bias-variance tradeoff?", "back": "The tension between a model's ability to fit training data (low bias) and generalize to new data (low variance). Complex models have low bias but high variance; simple models have high bias but low variance.", "difficulty": "medium"},
            {"id": "fc-2", "front": "What is gradient descent?", "back": "An optimization algorithm that iteratively adjusts parameters in the direction that minimizes the loss function, using the gradient to determine the direction and magnitude of updates.", "difficulty": "medium"},
            {"id": "fc-3", "front": "What is the difference between supervised and unsupervised learning?", "back": "Supervised learning uses labeled data to learn a mapping function. Unsupervised learning finds patterns in unlabeled data without predefined outputs.", "difficulty": "easy"},
            {"id": "fc-4", "front": "What is overfitting and how can it be prevented?", "back": "Overfitting is when a model learns noise rather than the underlying pattern. Prevention: regularization, cross-validation, early stopping, more training data.", "difficulty": "medium"},
            {"id": "fc-5", "front": "What is cross-validation?", "back": "A technique to assess model performance by partitioning data into subsets, training on some and testing on others, rotating through all combinations.", "difficulty": "easy"}
        ],
        "questions": [
            {"id": "q-1", "question": "Explain how you would diagnose whether a model is suffering from high bias or high variance.", "suggested_answer": "High bias: both training and validation errors are high. High variance: training error is low but validation error is high. Address bias with more complex models; address variance with regularization or more data.", "question_type": "application"},
            {"id": "q-2", "question": "Why is the choice of loss function important in machine learning?", "suggested_answer": "The loss function defines what the model optimizes for. MSE for regression penalizes large errors; cross-entropy for classification measures probability distribution differences. Wrong choice leads to poor performance.", "question_type": "conceptual"}
        ],
        "events": [
            {"id": "ev-1", "title": "CS 229 Midterm Exam", "event_type": "exam", "date": "2025-01-15T14:00:00", "confidence": 1.0},
            {"id": "ev-2", "title": "Problem Set 3 Due", "event_type": "assignment", "date": "2025-01-10T23:59:00", "confidence": 1.0}
        ]
    },
    {
        "id": "demo-2",
        "title": "Organic Chemistry: Reaction Mechanisms",
        "course_name": "CHEM 201 - Organic Chemistry",
        "summary": """Organic reaction mechanisms describe the step-by-step process of how chemical reactions occur at the molecular level. Understanding mechanisms allows chemists to predict products, design synthetic routes, and explain reaction outcomes.

Nucleophilic substitution reactions (SN1 and SN2) are fundamental transformations where a nucleophile replaces a leaving group. SN2 reactions occur in a single concerted step with inversion of stereochemistry. SN1 reactions proceed through a carbocation intermediate, allowing racemization.

Elimination reactions (E1 and E2) compete with substitution, forming alkenes. The Zaitsev rule predicts that the major product will be the more substituted alkene. Understanding when substitution versus elimination dominates requires analysis of substrate structure, nucleophile strength, and reaction conditions.""",
        "key_concepts": [
            "SN1 vs SN2 Mechanisms",
            "Carbocation Stability",
            "Nucleophilicity vs Basicity",
            "E1 and E2 Elimination",
            "Zaitsev's Rule",
            "Stereochemistry in Reactions",
            "Leaving Group Ability"
        ],
        "flashcards": [
            {"id": "fc-6", "front": "What factors favor SN2 over SN1?", "back": "Primary or methyl substrates, strong nucleophiles, polar aprotic solvents, and good leaving groups. SN2 is a concerted one-step mechanism.", "difficulty": "medium"},
            {"id": "fc-7", "front": "What is Zaitsev's rule?", "back": "In elimination reactions, the major product is typically the more substituted alkene, as it is more thermodynamically stable.", "difficulty": "easy"},
            {"id": "fc-8", "front": "How does carbocation stability affect SN1 reactions?", "back": "SN1 proceeds through carbocation intermediates. Tertiary carbocations are most stable, so tertiary substrates favor SN1. Order: 3° > 2° > 1° > methyl.", "difficulty": "medium"},
            {"id": "fc-9", "front": "What is the stereochemical outcome of SN2 reactions?", "back": "Complete inversion of configuration (Walden inversion) because the nucleophile attacks from the opposite side of the leaving group.", "difficulty": "medium"}
        ],
        "questions": [
            {"id": "q-3", "question": "Given 2-bromobutane reacting with NaOH in DMSO, predict the major product and mechanism.", "suggested_answer": "Major product is 2-butanol via SN2. Secondary substrate with polar aprotic solvent and strong nucleophile favors SN2 with inversion.", "question_type": "application"},
            {"id": "q-4", "question": "Why do tertiary substrates undergo E2 instead of SN2 with strong bases?", "suggested_answer": "SN2 requires backside attack, but tertiary substrates have steric hindrance from three bulky groups. Bases instead abstract β-hydrogen for E2 elimination.", "question_type": "conceptual"}
        ],
        "events": [
            {"id": "ev-3", "title": "CHEM 201 Lab Report Due", "event_type": "assignment", "date": "2025-01-08T17:00:00", "confidence": 1.0},
            {"id": "ev-4", "title": "CHEM 201 Quiz 2", "event_type": "quiz", "date": "2025-01-12T10:00:00", "confidence": 1.0}
        ]
    },
    {
        "id": "demo-3",
        "title": "Microeconomics: Supply and Demand",
        "course_name": "ECON 101 - Principles of Economics",
        "summary": """Supply and demand form the foundation of market economics, explaining how prices are determined and resources allocated. The interaction creates market equilibrium where quantity supplied equals quantity demanded.

Demand curves slope downward due to diminishing marginal utility. Shifts occur due to changes in income, preferences, related goods, expectations, or number of buyers. Supply curves slope upward because higher prices incentivize more production.

Elasticity measures responsiveness to price changes. Price elasticity of demand shows how quantity demanded responds to price changes, with implications for revenue and tax incidence. Understanding these concepts is essential for analyzing market interventions and policy effects.""",
        "key_concepts": [
            "Law of Supply and Demand",
            "Market Equilibrium",
            "Price Elasticity",
            "Shifts vs Movements Along Curves",
            "Consumer and Producer Surplus",
            "Deadweight Loss",
            "Market Efficiency"
        ],
        "flashcards": [
            {"id": "fc-10", "front": "What's the difference between a shift and movement along the demand curve?", "back": "Movement along: price changes cause quantity demanded to change. Shift: non-price factors (income, preferences, related goods) shift the entire curve.", "difficulty": "easy"},
            {"id": "fc-11", "front": "What is price elasticity of demand?", "back": "Measures how sensitive quantity demanded is to price changes. % change in quantity / % change in price. Elastic (>1): very responsive. Inelastic (<1): less responsive.", "difficulty": "medium"},
            {"id": "fc-12", "front": "What is consumer surplus?", "back": "The difference between willingness to pay and actual price paid. Graphically, the area below demand curve and above price line.", "difficulty": "medium"},
            {"id": "fc-13", "front": "What causes deadweight loss?", "back": "When market quantity deviates from equilibrium due to taxes, price controls, or monopoly. Represents lost surplus from transactions that don't occur.", "difficulty": "hard"}
        ],
        "questions": [
            {"id": "q-5", "question": "If a 10% price increase leads to 5% decrease in quantity demanded, calculate elasticity and explain pricing implications.", "suggested_answer": "Elasticity = 0.5 (inelastic). Since demand is inelastic, raising prices increases total revenue because quantity drops proportionally less than price rises.", "question_type": "application"},
            {"id": "q-6", "question": "Explain why minimum wage laws can lead to unemployment using supply and demand.", "suggested_answer": "Minimum wage is a price floor above equilibrium. At higher wages, quantity of labor supplied exceeds quantity demanded, creating surplus (unemployment). Severity depends on elasticity.", "question_type": "conceptual"}
        ],
        "events": [
            {"id": "ev-5", "title": "ECON 101 Final Exam", "event_type": "exam", "date": "2025-01-20T09:00:00", "confidence": 1.0}
        ]
    }
]


@router.get("/notes")
async def get_demo_notes():
    """Get pre-processed demo notes for unauthenticated users."""
    return {
        "notes": [
            {
                "id": note["id"],
                "title": note["title"],
                "course_name": note["course_name"],
                "summary_preview": note["summary"][:200] + "...",
                "flashcards_count": len(note["flashcards"]),
                "questions_count": len(note["questions"]),
                "events_count": len(note["events"])
            }
            for note in DEMO_NOTES
        ]
    }


@router.get("/notes/{note_id}")
async def get_demo_note(note_id: str):
    """Get a specific demo note with all details."""
    for note in DEMO_NOTES:
        if note["id"] == note_id:
            return note
    return {"error": "Demo note not found"}


@router.get("/flashcards")
async def get_demo_flashcards():
    """Get all demo flashcards."""
    all_flashcards = []
    for note in DEMO_NOTES:
        for fc in note["flashcards"]:
            all_flashcards.append({
                **fc,
                "note_title": note["title"],
                "course_name": note["course_name"]
            })
    return {"flashcards": all_flashcards}


@router.get("/stats")
async def get_demo_stats():
    """Get demo statistics."""
    total_flashcards = sum(len(note["flashcards"]) for note in DEMO_NOTES)
    total_questions = sum(len(note["questions"]) for note in DEMO_NOTES)
    total_events = sum(len(note["events"]) for note in DEMO_NOTES)
    
    return {
        "total_notes": len(DEMO_NOTES),
        "total_flashcards": total_flashcards,
        "total_questions": total_questions,
        "total_events": total_events,
        "courses": list(set(note["course_name"] for note in DEMO_NOTES))
    }
