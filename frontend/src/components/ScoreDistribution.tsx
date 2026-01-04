import type { FC } from 'react';
import { Bar } from 'react-chartjs-2';

interface ScoreDistributionProps {
    averages: Record<string, number>;
}

export const ScoreDistribution: FC<ScoreDistributionProps> = ({ averages }) => {
    const formatLabel = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
    };

    const labels = Object.keys(averages).map(formatLabel);
    const dataValues = Object.values(averages);

    const data = {
        labels,
        datasets: [
            {
                label: 'Average Score (1-5)',
                data: dataValues,
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                max: 7,
                title: {
                    display: true,
                    text: 'Score (1-7)'
                }
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Average Scores by Category',
            },
        },
    };

    return <Bar data={data} options={options} />;
};
