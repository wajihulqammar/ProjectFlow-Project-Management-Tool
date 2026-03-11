module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/(app)/layout.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(app)/layout.tsx [app-rsc] (ecmascript)"));
}),
"[project]/src/app/(app)/dashboard/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {

const express = (()=>{
    const e = new Error("Cannot find module 'express'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const router = express.Router();
const Project = (()=>{
    const e = new Error("Cannot find module '../models/Project'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const Task = (()=>{
    const e = new Error("Cannot find module '../models/Task'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const Activity = (()=>{
    const e = new Error("Cannot find module '../models/Activity'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
const { authenticate } = (()=>{
    const e = new Error("Cannot find module '../middleware/auth'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
router.get('/', authenticate, async (req, res, next)=>{
    try {
        const userId = req.user._id;
        const now = new Date();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weekAhead = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        // Get all project IDs user belongs to
        const userProjects = await Project.find({
            $or: [
                {
                    owner: userId
                },
                {
                    'members.user': userId
                }
            ],
            isArchived: false
        }).distinct('_id');
        const [totalProjects, activeProjects, myTasks, overdueTasks, completedThisWeek, recentActivity, upcomingTasks] = await Promise.all([
            // Total projects user is part of
            Project.countDocuments({
                $or: [
                    {
                        owner: userId
                    },
                    {
                        'members.user': userId
                    }
                ],
                isArchived: false
            }),
            // Active projects
            Project.countDocuments({
                $or: [
                    {
                        owner: userId
                    },
                    {
                        'members.user': userId
                    }
                ],
                status: 'active',
                isArchived: false
            }),
            // My open tasks (assigned to me across all projects)
            Task.countDocuments({
                project: {
                    $in: userProjects
                },
                assignees: userId,
                isArchived: false,
                status: {
                    $nin: [
                        'done',
                        'cancelled'
                    ]
                }
            }),
            // Overdue = all tasks in user's projects that are past due and not done
            Task.countDocuments({
                project: {
                    $in: userProjects
                },
                dueDate: {
                    $lt: now
                },
                status: {
                    $nin: [
                        'done',
                        'cancelled'
                    ]
                },
                isArchived: false
            }),
            // Completed this week (by anyone in user's projects)
            Task.countDocuments({
                project: {
                    $in: userProjects
                },
                status: 'done',
                completedAt: {
                    $gte: weekAgo
                }
            }),
            // Recent activity across user's projects
            Activity.find({
                project: {
                    $in: userProjects
                }
            }).populate('actor', 'name avatar avatarColor').populate('project', 'name color emoji').populate('task', 'title taskNumber').sort({
                createdAt: -1
            }).limit(15),
            // Upcoming tasks (due in 7 days, assigned to me)
            Task.find({
                project: {
                    $in: userProjects
                },
                assignees: userId,
                dueDate: {
                    $gte: now,
                    $lte: weekAhead
                },
                status: {
                    $nin: [
                        'done',
                        'cancelled'
                    ]
                },
                isArchived: false
            }).populate('project', 'name color emoji').sort({
                dueDate: 1
            }).limit(10)
        ]);
        // Priority distribution across all tasks in user's projects
        const priorityDist = await Task.aggregate([
            {
                $match: {
                    project: {
                        $in: userProjects
                    },
                    isArchived: false,
                    status: {
                        $nin: [
                            'done',
                            'cancelled'
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$priority',
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]);
        // Completion trend last 7 days
        const trend = await Promise.all(Array.from({
            length: 7
        }, (_, i)=>{
            const date = new Date();
            date.setDate(date.getDate() - i);
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            return Task.countDocuments({
                project: {
                    $in: userProjects
                },
                status: 'done',
                completedAt: {
                    $gte: start,
                    $lte: end
                }
            }).then((count)=>({
                    date: start.toISOString().split('T')[0],
                    count
                }));
        }));
        // Projects with live progress
        const myProjects = await Project.find({
            $or: [
                {
                    owner: userId
                },
                {
                    'members.user': userId
                }
            ],
            isArchived: false,
            status: {
                $ne: 'archived'
            }
        }).populate('members.user', 'name avatar avatarColor').sort({
            updatedAt: -1
        }).limit(6);
        const projectsWithProgress = await Promise.all(myProjects.map(async (p)=>{
            const [total, completed, overdue] = await Promise.all([
                Task.countDocuments({
                    project: p._id,
                    isArchived: false
                }),
                Task.countDocuments({
                    project: p._id,
                    status: 'done',
                    isArchived: false
                }),
                Task.countDocuments({
                    project: p._id,
                    dueDate: {
                        $lt: now
                    },
                    status: {
                        $nin: [
                            'done',
                            'cancelled'
                        ]
                    },
                    isArchived: false
                })
            ]);
            return {
                ...p.toObject(),
                totalTasks: total,
                completedTasks: completed,
                overdueTasks: overdue,
                completionPercentage: total === 0 ? 0 : Math.round(completed / total * 100)
            };
        }));
        res.json({
            stats: {
                totalProjects,
                activeProjects,
                myTasks,
                overdueTasks,
                completedThisWeek
            },
            recentActivity,
            upcomingTasks,
            priorityDistribution: priorityDist,
            completionTrend: trend.reverse(),
            projects: projectsWithProgress
        });
    } catch (err) {
        next(err);
    }
});
module.exports = router;
}),
"[project]/src/app/(app)/dashboard/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/(app)/dashboard/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__17c7309d._.js.map