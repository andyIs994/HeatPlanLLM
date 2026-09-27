"""Boundary tests for candidate selection, not tests that certify recipe safety."""
import unittest
from prepare_kaggle import classify, url_key


def row(title,path,steps,ingredients='1 apple'):
    return dict(title=title,source_category_path=path,steps=[{'text':steps}],ingredients=[{'text':ingredients}],cook_time_raw=None)


class SelectionTests(unittest.TestCase):
    def test_frozen_ingredient_does_not_mean_cold_serving(self):
        candidate,_=classify(row('Peach Pie with Frozen Peaches','/Desserts/','Bake and serve warm.'))
        self.assertIsNone(candidate)
        candidate,_=classify(row('Air Fryer Frozen Chicken Strips','/Main Dishes/','Air fry until cooked.'))
        self.assertIsNone(candidate)

    def test_chilled_salsa_does_not_make_grilled_fish_a_cold_dish(self):
        candidate,_=classify(row('Grilled Tilapia with Mango Salsa','/Seafood/','Chill until ready to serve. Grill fish and top with salsa.'))
        self.assertIsNone(candidate)

    def test_no_bake_does_not_establish_serving_temperature(self):
        candidate,_=classify(row('No-Bake Cookies','/Desserts/','Mix and set aside.'))
        self.assertIsNotNone(candidate);self.assertEqual(candidate['temperature_candidate'],'unknown')
        self.assertIsNone(candidate['product_temperature']);self.assertIsNone(candidate['allergen_ids'])
        self.assertFalse(candidate['eligible_for_product_prototype'])

    def test_alcohol_is_excluded_from_initial_batch(self):
        candidate,reason=classify(row('Fruit Punch','/Drinks Recipes/','Serve over ice.','1 cup rum'))
        self.assertIsNone(candidate);self.assertEqual(reason,'alcohol_signal')

    def test_warm_salad_is_not_selected_for_first_cold_batch(self):
        self.assertIsNone(classify(row('Warm Shrimp Salad','/Salad/','Mix and serve.'))[0])

    def test_title_does_not_imply_verified_cuisine(self):
        candidate,_=classify(row('Thai-Inspired Fruit Salad','/Salad/','Serve chilled.'))
        self.assertEqual(candidate['cuisine_id'],'unclassified')
        candidate,_=classify(row('Fruit Salad','/Cuisine/Asian/Thai/','Serve chilled.'))
        self.assertEqual(candidate['cuisine_id'],'thai')

    def test_url_dedup_ignores_tracking_and_scheme(self):
        self.assertEqual(url_key('http://www.allrecipes.com/recipe/123/test/?tracking=1'),url_key('https://allrecipes.com/recipe/123/test'))


if __name__=='__main__':unittest.main()
